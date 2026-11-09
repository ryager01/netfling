@echo off
rem ==============================================================================
rem NetSentinel - GitHub Automated One-Click Updater (update.bat)
rem Pulls latest releases and source archives from GitHub, updates dependencies,
rem rebuilds Vite frontend, and restarts NetSentinel dev server.
rem ==============================================================================

setlocal EnableDelayedExpansion
title NetSentinel - GitHub Auto-Updater
cd /d "%~dp0"

echo:
echo  ============================================================================
echo     _   _      _   ____             _   _            _ 
echo    ^| \ ^| ^| ___^| ^|_/ ___^|  ___ _ __ ^| ^|_^(_^) _ __   ___^| ^|
echo    ^|  \^| ^|/ _ \ __\___ \ / _ \ '_ \^| __^| ^| '_ \ / _ \ ^|
echo    ^| ^|\  ^|  __/ ^|_ ___) ^|  __/ ^| ^| ^| ^|_^| ^| ^| ^| ^|  __/ ^|
echo    ^|_^| \_^|\___^|\__^|____/ \___^|_^| ^|_^|\__^|_^|_^| ^|_^|\___^|_^|
echo:
echo     NetSentinel Network Security Intelligence Suite
echo     GitHub Automated Update Launcher
echo  ============================================================================
echo:

echo [*] Terminating active dev server instances...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im tsx.exe >nul 2>&1

echo [*] Launching PowerShell GitHub updater script...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0update.ps1" %*
set "UPDATE_EXIT_CODE=!ERRORLEVEL!"

echo:
if "!UPDATE_EXIT_CODE!"=="0" (
    echo  ============================================================================
    echo     [SUCCESS] NetSentinel updated to the latest GitHub version!
    echo  ============================================================================
    echo:
    set /p "RESTART_NOW=Do you want to start NetSentinel now? (Y/N, default Y): "
    if /i "!RESTART_NOW!"=="" set "RESTART_NOW=Y"
    if /i "!RESTART_NOW!"=="Y" (
        echo [*] Launching NetSentinel...
        start "" "%~dp0start.bat"
        exit /b 0
    )
) else (
    echo  ============================================================================
    echo     [ERROR] GitHub update encountered an issue ^(Code: !UPDATE_EXIT_CODE!^).
    echo     You can manual download the zip from https://github.com/netfling/netsentinel
    echo  ============================================================================
)

echo Press any key to exit...
pause >nul
exit /b !UPDATE_EXIT_CODE!
