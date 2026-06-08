$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 8765
$existing = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
$node = "C:\Program Files\nodejs\node.exe"
if (-not (Test-Path $node)) {
    $node = "node"
}
if (-not $existing) {
    Start-Process -FilePath $node -ArgumentList "serve-static.mjs" -WorkingDirectory $here -WindowStyle Hidden
    Start-Sleep -Seconds 1
}

Start-Process "http://127.0.0.1:$port/index.html"
