$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 8765
$existing = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
$node = "C:\Program Files\nodejs\node.exe"
if (-not (Test-Path $node)) {
    $node = "node"
}

if (-not $existing) {
    $process = New-Object System.Diagnostics.Process
    $process.StartInfo.FileName = $node
    $process.StartInfo.Arguments = "serve-static.mjs"
    $process.StartInfo.WorkingDirectory = $here
    $process.StartInfo.UseShellExecute = $false
    $process.StartInfo.CreateNoWindow = $true
    $process.StartInfo.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
    $process.StartInfo.RedirectStandardOutput = $true
    $process.StartInfo.RedirectStandardError = $true
    $process.Start() | Out-Null
    Start-Sleep -Seconds 1
}

Start-Process "http://127.0.0.1:$port/index.html"
