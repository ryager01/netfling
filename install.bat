@echo off
rem ==============================================================================
rem NetSentinel - Windows 11 One-Click Installer Launcher (install.bat)
rem Executes install.ps1 using PowerShell with ExecutionPolicy Bypass
rem ==============================================================================

setlocal
title NetSentinel Installer - Windows 11

rem Ensure script executes from the directory containing this batch file
cd /d "%~dp0"

echo:
echo ==================================================================
echo    NetSentinel Network Security Intelligence Suite
echo    Windows 11 One-Click Setup and Build Launcher
echo ==================================================================
rem Free any file locks on node_modules or ports before setup runs
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im tsx.exe >nul 2>&1

echo:
echo [*] Launching install.ps1 with ExecutionPolicy Bypass...
echo:

rem Execute install.ps1 with quoted path to support spaces in directory names
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1" %*
set "SCRIPT_EXIT_CODE=%ERRORLEVEL%"

echo:
if "%SCRIPT_EXIT_CODE%"=="0" (
    echo ==================================================================
    echo    [SUCCESS] NetSentinel Setup completed successfully!
    echo ==================================================================
) else (
    echo ==================================================================
    echo    [ERROR] NetSentinel Setup encountered an error. Exit Code: %SCRIPT_EXIT_CODE%
    echo ==================================================================
)
echo:
echo Press any key to exit this installer window...
pause >nul
exit /b %SCRIPT_EXIT_CODE%
