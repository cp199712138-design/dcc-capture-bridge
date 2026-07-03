$ErrorActionPreference = "Stop"

$target = "C:\ProgramData\Autodesk\ApplicationPlugins\HDViewportCapture.bundle"

if (Test-Path -LiteralPath $target) {
    Remove-Item -LiteralPath $target -Recurse -Force
    Write-Host "Removed $target"
} else {
    Write-Host "HD Viewport Capture is not installed at $target"
}
