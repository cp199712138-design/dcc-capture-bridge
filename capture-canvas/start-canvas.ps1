$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 8765
$node = "C:\Program Files\nodejs\node.exe"
if (-not (Test-Path $node)) {
    $node = "node"
}

$ready = $false
try {
    $status = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:$port/api/status" -TimeoutSec 2
    $ready = $status.StatusCode -eq 200
} catch {
    $ready = $false
}

if (-not $ready) {
    $processInfo = [System.Diagnostics.ProcessStartInfo]::new()
    $processInfo.FileName = $node
    $processInfo.Arguments = "serve-static.mjs"
    $processInfo.WorkingDirectory = $here
    $processInfo.UseShellExecute = $false
    $processInfo.CreateNoWindow = $true
    [System.Diagnostics.Process]::Start($processInfo) | Out-Null
    for ($i = 0; $i -lt 20; $i++) {
        Start-Sleep -Milliseconds 250
        try {
            $status = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:$port/api/status" -TimeoutSec 2
            if ($status.StatusCode -eq 200) { break }
        } catch {}
    }
}

Start-Process "http://127.0.0.1:$port/index.html"
