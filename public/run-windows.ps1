$ErrorActionPreference = 'Stop'

if (-not $env:DEV_SETUP_SCRIPT_B64) {
  throw 'DEV_SETUP_SCRIPT_B64 is missing.'
}

$path = Join-Path $env:TEMP "dev-setup-builder-$PID.bat"
$bytes = [Convert]::FromBase64String($env:DEV_SETUP_SCRIPT_B64)
[IO.File]::WriteAllBytes($path, $bytes)

cmd.exe /c $path
exit $LASTEXITCODE
