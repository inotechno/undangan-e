# Backup database Postgres (container Docker) ke backups/<nama>.sql.gz
# Pakai: pwsh -File scripts/backup-db.ps1
$ErrorActionPreference = "Stop"

$container = if ($env:PG_CONTAINER) { $env:PG_CONTAINER } else { "undangane-postgres-1" }
$db = if ($env:PG_DB) { $env:PG_DB } else { "undangane" }
$user = if ($env:PG_USER) { $env:PG_USER } else { "undangane" }

$root = Split-Path -Parent $PSScriptRoot
$dir = Join-Path $root "backups"
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$file = Join-Path $dir "undangane-$stamp.sql"

# pg_dump (plain SQL) -> file
docker exec $container pg_dump -U $user -d $db --no-owner --no-privileges | Set-Content -Path $file -Encoding UTF8

if (-not (Test-Path $file) -or (Get-Item $file).Length -eq 0) { throw "Backup gagal: file kosong/tidak ada" }

# Kompres gzip
$bytes = [IO.File]::ReadAllBytes($file)
$fs = [IO.File]::Open($file + ".gz", [IO.FileMode]::Create)
$gz = New-Object IO.Compression.GZipStream($fs, [IO.Compression.CompressionLevel]::Optimal)
try {
    $gz.Write($bytes, 0, $bytes.Length)
} finally {
    $gz.Close()
    $fs.Close()
}
Remove-Item $file -Force
$file = $file + ".gz"

if (-not (Test-Path $file) -or (Get-Item $file).Length -eq 0) { throw "Kompresi gagal" }
$mb = [math]::Round((Get-Item $file).Length / 1MB, 2)
Write-Host "OK backup -> $file ($mb MB)"

# Retensi: simpan 14 terbaru
Get-ChildItem $dir -Filter "undangane-*.sql.gz" | Sort-Object Name -Descending | Select-Object -Skip 13 | Remove-Item -Force
