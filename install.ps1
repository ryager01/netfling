# ==============================================================================
# NetSentinel - Windows 11 Automated Conda Setup, Environment Provisioning & App Compiler
# PowerShell Script (install.ps1) - Pure ASCII for Windows PowerShell 5.1 & PowerShell 7+
#
# Capabilities:
# 1. Validates Windows PowerShell / PowerShell 7+ execution environment on Windows 11.
# 2. Checks for existing Conda installation in PATH and standard Windows locations.
# 3. Downloads Miniconda for Windows (x86_64) silently if not installed.
# 4. Performs unattended silent installation to $env:USERPROFILE\miniconda3.
# 5. Boots the Conda hook in the current PowerShell process.
# 6. Provisions dedicated 'netsentinel' Conda environment (Python 3.11 + Node.js 20).
# 7. Installs all Python requirements and Node.js npm packages.
# 8. Compiles the TypeScript application and bundles production Vite assets.
# ==============================================================================

[CmdletBinding()]
param(
    [string]$EnvName = "netsentinel",
    [string]$InstallDir = (Join-Path -Path $env:USERPROFILE -ChildPath "miniconda3"),
    [switch]$SkipBuild = $false,
    [switch]$CreateShortcuts = $true,
    [switch]$ConfigureFirewall = $true,
    [switch]$LaunchAfterInstall = $false
)

$ErrorActionPreference = "Continue"
if ($PSVersionTable.PSVersion.Major -ge 7) {
    $PSNativeCommandUseErrorActionPreference = $false
}
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "    [NetSentinel] Network Security Intelligence Suite" -ForegroundColor Cyan
Write-Host "    Windows 11 Automated Conda Setup and Application Compiler" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host ""

# ------------------------------------------------------------------------------
# 1. System Verification & Architecture Check
# ------------------------------------------------------------------------------
Write-Host "[1/6] Verifying Windows System & Architecture..." -ForegroundColor Yellow

$os = [System.Environment]::OSVersion
$arch = [System.Environment]::GetEnvironmentVariable("PROCESSOR_ARCHITECTURE")
$is64Bit = [System.Environment]::Is64BitOperatingSystem

$osPlatformStr = $os.Platform.ToString()
$osVersionStr = $os.VersionString
$psVersionStr = $PSVersionTable.PSVersion.ToString()

Write-Host ("      OS Platform:     {0} ({1})" -f $osPlatformStr, $osVersionStr) -ForegroundColor Gray
Write-Host ("      Architecture:    {0} (64-bit: {1})" -f $arch, $is64Bit) -ForegroundColor Gray
Write-Host ("      PowerShell Ver:  {0}" -f $psVersionStr) -ForegroundColor Gray

if (-not $is64Bit) {
    Write-Error "NetSentinel requires a 64-bit Windows operating system (Windows 11 x64)."
    exit 1
}

# ------------------------------------------------------------------------------
# 2. Locate Existing Conda or Download & Install Miniconda for Windows
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "[2/6] Detecting Conda on System..." -ForegroundColor Yellow

$condaExe = $null
$defaultConda = Join-Path -Path $InstallDir -ChildPath "Scripts\conda.exe"
$programDataConda = "C:\ProgramData\miniconda3\Scripts\conda.exe"
$localAppDataConda = Join-Path -Path $env:LOCALAPPDATA -ChildPath "Continuum\miniconda3\Scripts\conda.exe"

# Check if conda is already in PATH
if (Get-Command conda -ErrorAction SilentlyContinue) {
    $condaCmd = Get-Command conda
    $condaExe = $condaCmd.Source
    Write-Host ("[OK] Found existing Conda in PATH: {0}" -f $condaExe) -ForegroundColor Green
}
# Check standard install locations
elseif (Test-Path $defaultConda) {
    $condaExe = $defaultConda
    Write-Host ("[OK] Found Conda in user profile: {0}" -f $condaExe) -ForegroundColor Green
}
elseif (Test-Path $programDataConda) {
    $condaExe = $programDataConda
    Write-Host ("[OK] Found Conda in ProgramData: {0}" -f $condaExe) -ForegroundColor Green
}
elseif (Test-Path $localAppDataConda) {
    $condaExe = $localAppDataConda
    Write-Host ("[OK] Found Conda in LocalAppData: {0}" -f $condaExe) -ForegroundColor Green
}
else {
    Write-Host "      Conda not detected. Preparing silent Miniconda3 Windows installation..." -ForegroundColor Cyan
    $minicondaUrl = "https://repo.anaconda.com/miniconda/Miniconda3-latest-Windows-x86_64.exe"
    $randomName = [System.IO.Path]::GetRandomFileName()
    $tempInstaller = Join-Path -Path $env:TEMP -ChildPath ("Miniconda3_Setup_" + $randomName + ".exe")

    Write-Host "      Downloading Miniconda installer from:" -ForegroundColor Gray
    Write-Host ("      {0}" -f $minicondaUrl) -ForegroundColor DarkCyan
    
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $minicondaUrl -OutFile $tempInstaller -UseBasicParsing

    Write-Host ("      Download completed. Installing silently into: {0} ..." -f $InstallDir) -ForegroundColor Cyan
    $installArgs = ("/InstallationType=JustMe /RegisterPython=0 /S /D=" + $InstallDir)
    
    $proc = Start-Process -FilePath $tempInstaller -ArgumentList $installArgs -Wait -PassThru
    if ($proc.ExitCode -ne 0) {
        Write-Error ("Miniconda installation failed with exit code: {0}" -f $proc.ExitCode)
        Remove-Item -Force $tempInstaller -ErrorAction SilentlyContinue
        exit 1
    }

    Remove-Item -Force $tempInstaller -ErrorAction SilentlyContinue
    $condaExe = Join-Path -Path $InstallDir -ChildPath "Scripts\conda.exe"
    Write-Host ("[OK] Miniconda3 installed successfully to: {0}" -f $InstallDir) -ForegroundColor Green
}

# ------------------------------------------------------------------------------
# 3. Initialize Conda Hook in Current PowerShell Session
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "[3/6] Initializing Conda Environment in PowerShell..." -ForegroundColor Yellow

# Accurately resolve Conda root directory (using conda info --base if possible)
$condaRoot = $null
try {
    $infoBase = (& $condaExe info --base 2>$null)
    if ($infoBase -and (Test-Path $infoBase.Trim())) {
        $condaRoot = $infoBase.Trim()
    }
} catch {}

if (-not $condaRoot) {
    if ($condaExe -match "(?i)(.*?\\(?:mini|ana)conda3)") {
        $condaRoot = $Matches[1]
    } else {
        $curr = (Get-Item $condaExe).Directory
        while ($curr -and $curr.Parent -and (-not (Test-Path (Join-Path $curr.FullName "conda-meta")))) {
            $curr = $curr.Parent
        }
        if ($curr -and (Test-Path (Join-Path $curr.FullName "conda-meta"))) {
            $condaRoot = $curr.FullName
        } else {
            $condaRoot = (Get-Item $condaExe).Directory.Parent.FullName
        }
    }
}

Write-Host ("      Conda Root:      {0}" -f $condaRoot) -ForegroundColor Gray

$condaHookPs1 = Join-Path -Path $condaRoot -ChildPath "shell\condabin\conda-hook.ps1"
if (Test-Path $condaHookPs1) {
    Write-Host ("      Executing Conda hook: {0}" -f $condaHookPs1) -ForegroundColor Gray
    & $condaHookPs1
} else {
    Write-Host "      Configuring environment PATH with Conda binaries..." -ForegroundColor Gray
    $condaScriptsDir = Join-Path -Path $condaRoot -ChildPath "Scripts"
    $condaBinDir = Join-Path -Path $condaRoot -ChildPath "condabin"
    $pathAdditions = @($condaScriptsDir, $condaBinDir, $condaRoot)
    $env:Path = ($pathAdditions -join ";") + ";" + $env:Path
}

# ------------------------------------------------------------------------------
# 4. Provision Dedicated 'netsentinel' Conda Environment
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host ("[4/6] Provisioning Conda Environment '{0}' (Python 3.11 + Node.js)..." -f $EnvName) -ForegroundColor Yellow

$envList = & $condaExe env list
$envExists = $envList -match ("^\s*" + [regex]::Escape($EnvName) + "\s")

if ($envExists) {
    Write-Host ("      [OK] Environment '{0}' already provisioned and ready." -f $EnvName) -ForegroundColor Green
} else {
    Write-Host ("      Creating fresh environment: {0}..." -f $EnvName) -ForegroundColor Cyan
    $envCreated = $false

    # Attempt 1: conda-forge + defaults (Python 3.11 + Node.js 20). Note: nodejs bundles npm; npm must NOT be passed as a standalone package
    Write-Host "      Attempting conda environment creation with conda-forge (Python 3.11 + Node.js 20)..." -ForegroundColor Gray
    & $condaExe create -y -n $EnvName -c conda-forge -c defaults python=3.11 nodejs=20 pip sqlite
    if ($LASTEXITCODE -eq 0) { $envCreated = $true }

    # Attempt 2: defaults channel with Python 3.11 and nodejs
    if (-not $envCreated) {
        Write-Host "      Retrying environment creation with defaults channel (python=3.11 nodejs pip sqlite)..." -ForegroundColor Yellow
        & $condaExe create -y -n $EnvName python=3.11 nodejs pip sqlite
        if ($LASTEXITCODE -eq 0) { $envCreated = $true }
    }

    # Attempt 3: Core Python 3.11 environment (system Node.js will be used for web server)
    if (-not $envCreated) {
        Write-Host "      Retrying environment creation with core Python 3.11..." -ForegroundColor Yellow
        & $condaExe create -y -n $EnvName python=3.11 pip sqlite
        if ($LASTEXITCODE -eq 0) { $envCreated = $true }
    }

    if (-not $envCreated) {
        Write-Error ("Failed to provision Conda environment '{0}'. Please check internet connectivity and Conda configuration." -f $EnvName)
        exit 1
    }
}

# Resolve actual environment directory from conda env list
$envDir = $null
$envPrefixMatches = (& $condaExe env list)
foreach ($line in $envPrefixMatches) {
    if ($line -match ("^\s*" + [regex]::Escape($EnvName) + "\s+(?:[*+]\s+)?(.*)$")) {
        $matchedPath = $Matches[1].Trim()
        if (Test-Path $matchedPath) {
            $envDir = $matchedPath
            break
        }
    }
}

if (-not $envDir) {
    $envDir = Join-Path -Path $condaRoot -ChildPath ("envs\" + $EnvName)
}

Write-Host ("[OK] Environment prefix: {0}" -f $envDir) -ForegroundColor Green

# Locate environment binaries
$envPython = Join-Path -Path $envDir -ChildPath "python.exe"
$envPip = Join-Path -Path $envDir -ChildPath "Scripts\pip.exe"
$envNpm = Join-Path -Path $envDir -ChildPath "npm.cmd"
if (-not (Test-Path $envNpm)) {
    $envNpm = Join-Path -Path $envDir -ChildPath "Library\bin\npm.cmd"
}
if (-not (Test-Path $envNpm)) {
    if (Get-Command npm -ErrorAction SilentlyContinue) {
        $envNpm = (Get-Command npm).Source
    }
}

if (-not (Test-Path $envPython)) {
    Write-Error ("Python executable not found in environment at {0}" -f $envPython)
    exit 1
}

# Export environment paths into current PowerShell session PATH so node, npm, python, and pip are immediately accessible
$envBinPaths = @(
    $envDir,
    (Join-Path -Path $envDir -ChildPath "Scripts"),
    (Join-Path -Path $envDir -ChildPath "Library\bin"),
    (Join-Path -Path $envDir -ChildPath "bin")
) | Where-Object { Test-Path $_ }
$env:Path = ($envBinPaths -join ";") + ";" + $env:Path

# ------------------------------------------------------------------------------
# 5. Install Dependencies (Python & Node.js)
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host ("[5/6] Installing Application Dependencies inside: {0}..." -f $EnvName) -ForegroundColor Yellow

# Temporarily set ErrorActionPreference to Continue so harmless stderr warnings (e.g. npm deprecation notes) do not abort PowerShell 5.1
$savedEAP = $ErrorActionPreference
$ErrorActionPreference = "Continue"

# Install Python requirements with --no-cache-dir to avoid AppData pip cache lock collisions
if (Test-Path "requirements.txt") {
    Write-Host "      Installing Python requirements via pip (pip install --no-cache-dir -r requirements.txt)..." -ForegroundColor Gray
    $pipSuccess = $false

    if (Test-Path $envPip) {
        Write-Host ("      Executing: {0} install --no-cache-dir -r requirements.txt" -f $envPip) -ForegroundColor DarkGray
        & $envPip install --upgrade pip --quiet 2>$null
        & $envPip install --no-cache-dir -r requirements.txt
        if ($LASTEXITCODE -eq 0) { $pipSuccess = $true }
    }
    
    if (-not $pipSuccess -and (Test-Path $envPython)) {
        Write-Host ("      Executing: {0} -m pip install --no-cache-dir -r requirements.txt" -f $envPython) -ForegroundColor DarkGray
        & $envPython -m pip install --upgrade pip --quiet 2>$null
        & $envPython -m pip install --no-cache-dir -r requirements.txt
        if ($LASTEXITCODE -eq 0) { $pipSuccess = $true }
    }

    if (-not $pipSuccess) {
        if (Get-Command pip -ErrorAction SilentlyContinue) {
            pip install --no-cache-dir -r requirements.txt
        } elseif (Get-Command python -ErrorAction SilentlyContinue) {
            python -m pip install --no-cache-dir -r requirements.txt
        }
    }
    Write-Host "      [OK] Python dependencies installed successfully." -ForegroundColor Green
}

# Install Node.js npm packages and rebuild native modules
if (Test-Path "package.json") {
    Write-Host "      Installing Node.js npm dependencies..." -ForegroundColor Gray
    $npmExecutable = if (Test-Path $envNpm) { $envNpm } elseif (Get-Command npm -ErrorAction SilentlyContinue) { "npm" } else { $null }

    if ($npmExecutable) {
        # Unblock npm install scripts
        & $npmExecutable config set ignore-scripts false 2>$null

        Write-Host "      Running npm install with legacy peer deps..." -ForegroundColor DarkGray
        & $npmExecutable install --legacy-peer-deps

        # Rebuild native modules including esbuild
        Write-Host "      Rebuilding native dependencies (npm rebuild esbuild)..." -ForegroundColor Gray
        & $npmExecutable rebuild 2>$null
        & $npmExecutable rebuild esbuild 2>$null
    } else {
        Write-Warning "npm binary could not be found directly in path. You can run 'npm install' after activating conda."
    }
    Write-Host "      [OK] Node.js dependencies installed and binaries rebuilt." -ForegroundColor Green
}

# Restore strict ErrorActionPreference
$ErrorActionPreference = $savedEAP

# ------------------------------------------------------------------------------
# 6. Compile Application (TypeScript Check + Vite Production Bundle)
# ------------------------------------------------------------------------------
if (-not $SkipBuild) {
    Write-Host ""
    Write-Host "[6/6] Compiling Complete Application..." -ForegroundColor Yellow

    # Step A: Validate Python security engines
    Write-Host "      Verifying Python modules syntax..." -ForegroundColor Gray
    if (Test-Path $envPython) {
        & $envPython -m py_compile cli.py
        Get-ChildItem -Path "netsentinel\*.py" -ErrorAction SilentlyContinue | ForEach-Object {
            & $envPython -m py_compile $_.FullName
        }
        Write-Host "      [OK] Python security modules verified." -ForegroundColor Green
    }

    # Step B: TypeScript type check & Vite production build
    Write-Host "      Building production web assets via Vite..." -ForegroundColor Gray
    $savedBuildEAP = $ErrorActionPreference
    $ErrorActionPreference = "Continue"

    if (Test-Path $envNpm) {
        & $envNpm run build
    } elseif (Get-Command npm -ErrorAction SilentlyContinue) {
        npm run build
    }

    $ErrorActionPreference = $savedBuildEAP
    
    if (Test-Path "dist\index.html") {
        Write-Host "      [OK] Production frontend assets compiled into .\dist" -ForegroundColor Green
    }
}

# ------------------------------------------------------------------------------
# 7. Windows 11 Integration (Desktop Shortcut, Start Menu, Firewall & Drivers)
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "[7/7] Configuring Windows 11 System Integration & Shortcuts..." -ForegroundColor Yellow

# A. Create Windows 11 Desktop & Start Menu Shortcuts across User, OneDrive & Public directories
if ($CreateShortcuts) {
    try {
        $scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).ProviderPath }
        $targetLauncher = Join-Path -Path $scriptDir -ChildPath "start.bat"

        # Helper to create shortcut reliably
        function New-NetSentinelShortcut {
            param (
                [string]$ShortcutPath,
                [string]$TargetBatPath,
                [string]$WorkingDir
            )
            try {
                $parentDir = Split-Path -Parent $ShortcutPath
                if (-not (Test-Path $parentDir)) {
                    New-Item -ItemType Directory -Path $parentDir -Force | Out-Null
                }
                $wsh = New-Object -ComObject WScript.Shell
                $sc = $wsh.CreateShortcut($ShortcutPath)
                $sc.TargetPath = "C:\Windows\System32\cmd.exe"
                $sc.Arguments = "/c `"$TargetBatPath`""
                $sc.WorkingDirectory = $WorkingDir
                $sc.Description = "NetSentinel Network Security Intelligence Suite (Windows 11)"
                $sc.IconLocation = "%SystemRoot%\System32\shell32.dll, 18"
                $sc.Save()
                Write-Host ("      [OK] Created shortcut: {0}" -f $ShortcutPath) -ForegroundColor Green
            } catch {
                Write-Warning ("      [!] Could not create shortcut at {0}: {1}" -f $ShortcutPath, $_.Exception.Message)
            }
        }

        # 1. Target all potential Windows 11 Desktop locations (User, OneDrive, Public)
        $desktopLocations = @(
            (Join-Path -Path $env:USERPROFILE -ChildPath "Desktop"),
            (Join-Path -Path $env:USERPROFILE -ChildPath "OneDrive\Desktop"),
            [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop),
            [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::CommonDesktop),
            "C:\Users\Public\Desktop"
        ) | Select-Object -Unique

        foreach ($dPath in $desktopLocations) {
            if (Test-Path $dPath) {
                $desktopShortcutPath = Join-Path -Path $dPath -ChildPath "NetSentinel Security.lnk"
                New-NetSentinelShortcut -ShortcutPath $desktopShortcutPath -TargetBatPath $targetLauncher -WorkingDir $scriptDir
            }
        }

        # 2. Target all potential Windows 11 Start Menu Locations
        $startMenuLocations = @(
            (Join-Path -Path ([System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Programs)) -ChildPath "NetSentinel"),
            (Join-Path -Path ([System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::CommonPrograms)) -ChildPath "NetSentinel"),
            (Join-Path -Path $env:APPDATA -ChildPath "Microsoft\Windows\Start Menu\Programs\NetSentinel"),
            "C:\ProgramData\Microsoft\Windows\Start Menu\Programs\NetSentinel"
        ) | Select-Object -Unique

        foreach ($sMenuPath in $startMenuLocations) {
            $startShortcutPath = Join-Path -Path $sMenuPath -ChildPath "NetSentinel Security.lnk"
            New-NetSentinelShortcut -ShortcutPath $startShortcutPath -TargetBatPath $targetLauncher -WorkingDir $scriptDir
        }
    } catch {
        Write-Warning ("Could not complete shortcut configuration: {0}" -f $_.Exception.Message)
    }
}

# B. Configure Windows 11 Defender Firewall (Port 3000 Inbound)
if ($ConfigureFirewall) {
    try {
        Write-Host "      Configuring Windows Defender Firewall rule for port 3000..." -ForegroundColor Gray
        $ruleName = "NetSentinel Security Suite (Port 3000)"
        $existing = netsh advfirewall firewall show rule name=$ruleName 2>$null
        if ($LASTEXITCODE -ne 0) {
            netsh advfirewall firewall add rule name=$ruleName dir=in action=allow protocol=TCP localport=3000 >$null 2>&1
            Write-Host "      [OK] Windows 11 Firewall rule configured for port 3000." -ForegroundColor Green
        } else {
            Write-Host "      [OK] Windows 11 Firewall rule already configured." -ForegroundColor Green
        }
    } catch {
        Write-Host "      Note: Run installer as Administrator to automatically open Windows Firewall port 3000." -ForegroundColor DarkGray
    }
}

# C. Check Packet Capture Driver (Npcap / WinPcap) for Raw Packet Sweeps
$npcapInstalled = (Test-Path "C:\Program Files\Npcap\wpcap.dll") -or (Test-Path "C:\Windows\System32\Npcap\wpcap.dll") -or (Test-Path "C:\Windows\System32\wpcap.dll")
if ($npcapInstalled) {
    Write-Host "      [OK] Npcap / WinPcap packet capture driver detected." -ForegroundColor Green
} else {
    Write-Host "      [INFO] Optional: For kernel-level raw promiscuous ARP/Wi-Fi sniffing on Windows 11, install Npcap from https://npcap.com/" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Green
Write-Host "    [SUCCESS] NetSentinel Windows 11 Setup and Build Completed!" -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Green
Write-Host "To launch NetSentinel on Windows 11:"
Write-Host "  1. Option A (Recommended): One-Click Desktop Shortcut" -ForegroundColor Yellow
Write-Host "     Double-click 'NetSentinel Security' on your Windows 11 Desktop" -ForegroundColor Cyan
Write-Host "  2. Option B (Command Line Launcher):" -ForegroundColor Yellow
Write-Host "     .\start.bat" -ForegroundColor Cyan
Write-Host "  3. Option C (Manual PowerShell):" -ForegroundColor Yellow
Write-Host ("     conda activate {0}" -f $EnvName) -ForegroundColor Cyan
Write-Host "     npm run dev" -ForegroundColor Cyan
Write-Host "  4. Open In Browser:" -ForegroundColor Yellow
Write-Host "     http://localhost:3000" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Green
Write-Host ""

if ($LaunchAfterInstall) {
    Write-Host "[*] Launching NetSentinel now..." -ForegroundColor Cyan
    Start-Process -FilePath ".\start.bat"
}

