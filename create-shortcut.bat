@echo off
rem ==============================================================================
rem NetSentinel - Instant Desktop Shortcut Creator for Windows 11 (create-shortcut.bat)
rem Creates "NetSentinel Security.lnk" on Desktop (User, OneDrive, Public) and Start Menu
rem ==============================================================================

setlocal EnableDelayedExpansion
title NetSentinel - Create Windows 11 Desktop Shortcut
cd /d "%~dp0"

echo:
echo ==================================================================
echo    NetSentinel Network Security Intelligence Suite
echo    Windows 11 Desktop Shortcut Creator
echo ==================================================================
echo:

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "^
$scriptDir = '%~dp0'; ^
if ($scriptDir.EndsWith('\')) { $scriptDir = $scriptDir.Substring(0, $scriptDir.Length - 1) }; ^
$startBat = Join-Path $scriptDir 'start.bat'; ^
$desktops = @( ^
    (Join-Path $env:USERPROFILE 'Desktop'), ^
    (Join-Path $env:USERPROFILE 'OneDrive\Desktop'), ^
    'C:\Users\Public\Desktop', ^
    [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop), ^
    [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::CommonDesktop) ^
) | Select-Object -Unique; ^
$wsh = New-Object -ComObject WScript.Shell; ^
$createdCount = 0; ^
foreach ($d in $desktops) { ^
    if (Test-Path $d) { ^
        try { ^
            $lnk = Join-Path $d 'NetSentinel Security.lnk'; ^
            $s = $wsh.CreateShortcut($lnk); ^
            $s.TargetPath = 'C:\Windows\System32\cmd.exe'; ^
            $s.Arguments = '/c ' + '\"' + $startBat + '\"'; ^
            $s.WorkingDirectory = $scriptDir; ^
            $s.Description = 'NetSentinel Network Security Intelligence Suite (Windows 11)'; ^
            $s.IconLocation = '%SystemRoot%\System32\shell32.dll, 18'; ^
            $s.Save(); ^
            Write-Host ('[OK] Shortcut created on Desktop: ' + $lnk) -ForegroundColor Green; ^
            $createdCount++; ^
        } catch { ^
            Write-Warning ('Could not create shortcut in ' + $d + ': ' + $_.Exception.Message); ^
        } ^
    } ^
}; ^
$startMenus = @( ^
    (Join-Path ([System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Programs)) 'NetSentinel'), ^
    (Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\NetSentinel') ^
) | Select-Object -Unique; ^
foreach ($sm in $startMenus) { ^
    try { ^
        if (-not (Test-Path $sm)) { New-Item -ItemType Directory -Path $sm -Force | Out-Null }; ^
        $lnk = Join-Path $sm 'NetSentinel Security.lnk'; ^
        $s = $wsh.CreateShortcut($lnk); ^
        $s.TargetPath = 'C:\Windows\System32\cmd.exe'; ^
        $s.Arguments = '/c ' + '\"' + $startBat + '\"'; ^
        $s.WorkingDirectory = $scriptDir; ^
        $s.Description = 'NetSentinel Network Security Intelligence Suite (Windows 11)'; ^
        $s.IconLocation = '%SystemRoot%\System32\shell32.dll, 18'; ^
        $s.Save(); ^
        Write-Host ('[OK] Shortcut created in Start Menu: ' + $lnk) -ForegroundColor Green; ^
    } catch {} ^
}"

echo:
echo ==================================================================
echo [SUCCESS] NetSentinel Security shortcut update complete!
echo ==================================================================
echo:
echo Press any key to exit...
pause >nul
