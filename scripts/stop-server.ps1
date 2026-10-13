# Menghentikan server Next.js yang masih berjalan agar `next build`
# tidak gagal EBUSY saat menghapus .next/standalone (Windows).
$stopped = @()

Get-CimInstance Win32_Process |
  Where-Object {
    $_.Name -match '^(node|nodejs)\.exe$' -and
    $_.CommandLine -and
    (
      $_.CommandLine -match 'standalone[\\/]server\.js' -or
      $_.CommandLine -match 'next start' -or
      $_.CommandLine -match 'next dev'
    )
  } |
  ForEach-Object {
    Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    $stopped += "PID $($_.ProcessId)"
  }

if ($stopped.Count -gt 0) {
  Write-Host "[prebuild] Server dihentikan agar build tidak EBUSY: $($stopped -join ', ')"
  Start-Sleep -Milliseconds 500
}
