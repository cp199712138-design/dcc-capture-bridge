$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 8765
$existing = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
$node = "C:\Program Files\nodejs\node.exe"
if (-not (Test-Path $node)) {
    $node = "node"
}
$outLog = Join-Path $here "server.out.log"
$errLog = Join-Path $here "server.err.log"

if (-not $existing) {
    $commandLine = "`"$node`" serve-static.mjs > `"$outLog`" 2> `"$errLog`""
    Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{
        CommandLine = $commandLine
        CurrentDirectory = $here
    } | Out-Null
    Start-Sleep -Seconds 1
}

Start-Process "http://127.0.0.1:$port/index.html"
