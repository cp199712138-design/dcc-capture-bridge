$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$source = Join-Path $repoRoot "3ds Max\HDViewportCapture.bundle"
$targetRoot = "C:\ProgramData\Autodesk\ApplicationPlugins"
$target = Join-Path $targetRoot "HDViewportCapture.bundle"

if (-not (Test-Path -LiteralPath $source)) {
    throw "Bundle not found: $source"
}

New-Item -ItemType Directory -Path $targetRoot -Force | Out-Null

if (Test-Path -LiteralPath $target) {
    Remove-Item -LiteralPath $target -Recurse -Force
}

Copy-Item -LiteralPath $source -Destination $target -Recurse
Write-Host "Installed HD Viewport Capture to $target"
Write-Host "Restart 3ds Max, then add the macro from category: HD Viewport Capture"
