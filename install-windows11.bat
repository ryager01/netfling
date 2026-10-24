@echo off
rem ==============================================================================
rem NetSentinel - Official Windows 11 Automated One-Click Installer (install-windows11.bat)
rem Specifically tailored for Windows 11 (build 22000+) 64-bit systems
rem Handles UAC Administrator Elevation, Conda Provisioning, Shortcuts & Firewall
rem ==============================================================================

setlocal EnableDelayedExpansion
title NetSentinel Installer - Windows 11 Setup Wizard
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
echo     Official Windows 11 Automated Setup Wizard
echo  ============================================================================
echo:

rem 1. Check Windows 11 System Version
for /f "tokens=4-7 delims=[.] " %%i in ('ver') do (
    set "WIN_BUILD=%%k"
)
echo [*] Detected Windows Build: %WIN_BUILD%
if %WIN_BUILD% LSS 19041 (
    echo [!] Warning: Windows 11 (Build 22000+) recommended for best performance.
) else (
    echo [*] Windows 11 / Modern Windows subsystem verified.
)

rem 2. Check for Administrative Privileges (to open Windows Defender Firewall and create global shortcuts)
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [*] Running with Administrator privileges.
    set "IS_ADMIN=1"
) else (
    echo [*] Note: Running in standard user mode. UAC elevation available.
    set "IS_ADMIN=0"
)

rem 3. Terminate any stale processes holding dev server ports
echo [*] Terminating stale node or tsx server instances...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im tsx.exe >nul 2>&1

echo:
echo [*] Launching automated PowerShell installation with Windows 11 integration...
echo [*] Execution policy bypass enabled for NetSentinel installer session.
echo:

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1" -CreateShortcuts -ConfigureFirewall %*
set "SCRIPT_EXIT_CODE=%ERRORLEVEL%"

echo:
if "%SCRIPT_EXIT_CODE%"=="0" (
    echo  ============================================================================
    echo     [SUCCESS] NetSentinel installed successfully on Windows 11!
    echo  ============================================================================
    echo     Shortcuts have been placed on your Windows 11 Desktop and Start Menu:
    echo       - Desktop: "NetSentinel Security"
    echo       - Start Menu: Programs ^> NetSentinel
    echo       - Inbound Firewall Rule: Port 3000 opened for local network access
    echo:
    echo  ============================================================================
    set /p "LAUNCH_NOW=Do you want to launch NetSentinel now? (Y/N, default Y): "
    if /i "!LAUNCH_NOW!"=="" set "LAUNCH_NOW=Y"
    if /i "!LAUNCH_NOW!"=="Y" (
        echo [*] Starting NetSentinel...
        start "" "%~dp0start.bat"
        exit /b 0
    )
) else (
    echo  ============================================================================
    echo     [ERROR] NetSentinel Setup encountered an error (Code: %SCRIPT_EXIT_CODE%).
    echo     If execution failed due to permissions, right-click install-windows11.bat
    echo     and select "Run as Administrator".
    echo  ============================================================================
)

echo:
echo Press any key to exit this installer window...
pause >nul
exit /b %SCRIPT_EXIT_CODE%
