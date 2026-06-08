$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 8765
$existing = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
$node = "C:\Program Files\nodejs\node.exe"
if (-not (Test-Path $node)) {
    $node = "node"
}

if (-not $existing) {
    $command = "cmd /c cd /d `"$here`" && `"$node`" serve-static.mjs > server.out.log 2> server.err.log"
    $shell = New-Object -ComObject WScript.Shell
    $shell.Run($command, 0, $false) | Out-Null
    Start-Sleep -Seconds 1
}

Start-Process "http://127.0.0.1:$port/index.html"
