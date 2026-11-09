# ==============================================================================
# NetSentinel - PowerShell GitHub Updater (update.ps1)
# Downloads latest release/zip from GitHub repo, extracts updated files,
# updates Conda/pip/npm dependencies, and rebuilds application assets.
# ==============================================================================

[CmdletBinding()]
param(
    [string]$Repo = "netfling/netsentinel",
    [switch]$Force = $false
)

$ErrorActionPreference = "Continue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "    [NetSentinel] GitHub Automated Updater" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host ""

$scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).ProviderPath }

Write-Host ("[1/4] Interrogating GitHub Repository: {0}..." -f $Repo) -ForegroundColor Yellow

$zipUrl = ("https://github.com/{0}/archive/refs/heads/main.zip" -f $Repo)
$tempDir = Join-Path $env:TEMP "netsentinel-update-ps"
$tempZip = Join-Path $tempDir "latest-main.zip"

if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force | Out-Null
}
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

Write-Host ("[2/4] Downloading latest code package from GitHub...") -ForegroundColor Yellow
Write-Host ("      URL: {0}" -f $zipUrl) -ForegroundColor Gray

[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
Invoke-WebRequest -Uri $zipUrl -OutFile $tempZip -UserAgent "NetSentinel-Updater"

if (-not (Test-Path $tempZip)) {
    Write-Error "Failed to download update package from GitHub."
    exit 1
}

$fileSize = (Get-Item $tempZip).Length
Write-Host ("      [OK] Downloaded {0:N0} bytes." -f $fileSize) -ForegroundColor Green

Write-Host "[3/4] Extracting package and updating files..." -ForegroundColor Yellow
$extractDir = Join-Path $tempDir "extracted"
Expand-Archive -Path $tempZip -DestinationPath $extractDir -Force

$subFolders = Get-ChildItem -Path $extractDir -Directory
$rootSource = if ($subFolders.Count -gt 0) { $subFolders[0].FullName } else { $extractDir }

$preservedFiles = @("netsentinel.db", "netsentinel.db-wal", "netsentinel.db-shm", ".env")

$updateCount = 0
Get-ChildItem -Path $rootSource -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring($rootSource.Length).TrimStart("\", "/")
    if ($preservedFiles -contains $_.Name -or $preservedFiles -contains $rel) {
        return
    }
    $targetPath = Join-Path $scriptDir $rel
    $targetParent = Split-Path -Parent $targetPath
    if (-not (Test-Path $targetParent)) {
        New-Item -ItemType Directory -Path $targetParent -Force | Out-Null
    }
    Copy-Item -Path $_.FullName -Destination $targetPath -Force
    $updateCount++
}

Write-Host ("      [OK] Updated {0} files from GitHub." -f $updateCount) -ForegroundColor Green

Write-Host "[4/4] Updating Python & Node dependencies..." -ForegroundColor Yellow

# Run python requirement update if python available
if (Get-Command python -ErrorAction SilentlyContinue) {
    python -m pip install -r (Join-Path $scriptDir "requirements.txt") --quiet 2>$null
}

# Run npm build if npm available
if (Get-Command npm -ErrorAction SilentlyContinue) {
    Set-Location $scriptDir
    npm run build --quiet 2>$null
}

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Green
Write-Host "    [SUCCESS] NetSentinel updated to the latest GitHub version!" -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Green
Write-Host ""
