# Restore-test: restore dump terbaru ke DB sementara, sanity-check jumlah baris, lalu hapus.
# Pakai: pwsh -File scripts/restore-test.ps1 [-DumpFile backups\undangane-xxx.sql.gz]
param([string]$DumpFile)

$ErrorActionPreference = "Stop"

$container = if ($env:PG_CONTAINER) { $env:PG_CONTAINER } else { "undangane-postgres-1" }
$db = if ($env:PG_DB) { $env:PG_DB } else { "undangane" }
$user = if ($env:PG_USER) { $env:PG_USER } else { "undangane" }
$testDb = "undangane_restore_test"

$root = Split-Path -Parent $PSScriptRoot
if (-not $DumpFile) {
    $DumpFile = Get-ChildItem (Join-Path $root "backups") -Filter "undangane-*.sql.gz" -ErrorAction SilentlyContinue |
        Sort-Object Name -Descending | Select-Object -First 1 -ExpandProperty FullName
}
if (-not $DumpFile -or -not (Test-Path $DumpFile)) { throw "Tidak ada file dump. Jalankan scripts/backup-db.ps1 dulu." }
Write-Host "Dump: $DumpFile"

# 1. Buat DB test bersih
docker exec $container psql -U $user -d postgres -c "DROP DATABASE IF EXISTS $testDb;" | Out-Null
docker exec $container psql -U $user -d postgres -c "CREATE DATABASE $testDb;" | Out-Null

# 2. Restore (gzip -dc di dalam container tidak selalu ada — pipe via stdin dari host)
Write-Host "Restoring ke $testDb ..."
$gzip = [IO.Compression.GzipStream]::new([IO.File]::OpenRead($DumpFile), [IO.Compression.CompressionMode]::Decompress)
$reader = [IO.StreamReader]::new($gzip)
try {
    $sql = $reader.ReadToEnd()
} finally {
    $reader.Dispose(); $gzip.Dispose()
}
$sql | docker exec -i $container psql -U $user -d $testDb -v ON_ERROR_STOP=1 -q | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Restore gagal (exit $LASTEXITCODE)" }

# 3. Sanity check: bandingkan jumlah tabel + baris undangan dengan DB asli
function Get-RowCounts([string]$database) {
    $q = "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;"
    $tables = docker exec $container psql -U $user -d $database -t -A -c $q | Where-Object { $_ -ne "" }
    $counts = @{}
    foreach ($t in $tables) {
        $t = "$t".Trim()
        if ($t -eq "") { continue }
        $n = docker exec $container psql -U $user -d $database -t -A -c "SELECT count(*) FROM `"$t`";"
        $counts[$t] = [int]("$n".Trim())
    }
    return $counts
}

$src = Get-RowCounts $db
$dst = Get-RowCounts $testDb
$mismatch = @()
foreach ($t in $src.Keys) {
    if (-not $dst.ContainsKey($t)) { $mismatch += "tabel hilang: $t"; continue }
    if ($src[$t] -ne $dst[$t]) { $mismatch += "$($t): asli=$($src[$t]) restore=$($dst[$t])" }
}
foreach ($t in $dst.Keys) { if (-not $src.ContainsKey($t)) { $mismatch += "tabel ekstra: $t" } }

# 4. Bersihkan
docker exec $container psql -U $user -d postgres -c "DROP DATABASE $testDb;" | Out-Null

if ($mismatch.Count -gt 0) {
    Write-Host "FAIL restore-test:"
    $mismatch | ForEach-Object { Write-Host "  $_" }
    exit 1
}
Write-Host "OK restore-test: $($src.Count) tabel, $($src['invitations']) undangan, $($src['guests']) tamu - identik dengan sumber."
