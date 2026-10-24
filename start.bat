@echo off
rem ==============================================================================
rem NetSentinel - Windows 11 One-Click Application Launcher (start.bat)
rem Automatically activates 'netsentinel' Conda environment and starts dev server
rem ==============================================================================

title NetSentinel - Starting Security Intelligence Suite
cd /d "%~dp0"

echo ==================================================================
echo    NetSentinel Network Security Intelligence Suite
echo    Windows 11 Dev Server Launcher
echo ==================================================================
echo.

rem 1. Check for Conda executable in standard locations
set "CONDA_ACTIVATE="
if exist "%USERPROFILE%\miniconda3\Scripts\activate.bat" (
    set "CONDA_ACTIVATE=%USERPROFILE%\miniconda3\Scripts\activate.bat"
) else if exist "C:\miniconda3\Scripts\activate.bat" (
    set "CONDA_ACTIVATE=C:\miniconda3\Scripts\activate.bat"
) else if exist "%LOCALAPPDATA%\Continuum\miniconda3\Scripts\activate.bat" (
    set "CONDA_ACTIVATE=%LOCALAPPDATA%\Continuum\miniconda3\Scripts\activate.bat"
) else if exist "C:\ProgramData\miniconda3\Scripts\activate.bat" (
    set "CONDA_ACTIVATE=C:\ProgramData\miniconda3\Scripts\activate.bat"
) else if exist "%USERPROFILE%\anaconda3\Scripts\activate.bat" (
    set "CONDA_ACTIVATE=%USERPROFILE%\anaconda3\Scripts\activate.bat"
) else if exist "C:\anaconda3\Scripts\activate.bat" (
    set "CONDA_ACTIVATE=C:\anaconda3\Scripts\activate.bat"
)

rem 2. Activate Conda environment if activate.bat found
if defined CONDA_ACTIVATE (
    echo [*] Found Conda activation script at: %CONDA_ACTIVATE%
    echo [*] Activating 'netsentinel' Conda environment...
    call "%CONDA_ACTIVATE%" netsentinel
    if errorlevel 1 (
        echo [!] Activating via explicit environment path...
        if exist "%USERPROFILE%\miniconda3\Library\envs\netsentinel" (
            call "%CONDA_ACTIVATE%" "%USERPROFILE%\miniconda3\Library\envs\netsentinel"
        ) else if exist "%USERPROFILE%\miniconda3\envs\netsentinel" (
            call "%CONDA_ACTIVATE%" "%USERPROFILE%\miniconda3\envs\netsentinel"
        ) else if exist "C:\miniconda3\Library\envs\netsentinel" (
            call "%CONDA_ACTIVATE%" "C:\miniconda3\Library\envs\netsentinel"
        ) else if exist "C:\miniconda3\envs\netsentinel" (
            call "%CONDA_ACTIVATE%" "C:\miniconda3\envs\netsentinel"
        )
    )
) else (
    echo [*] Conda activation script not in standard path. Attempting conda activate...
    call conda activate netsentinel 2>nul
)

rem 3. Detect and terminate any zombie process holding port 3000 or 24678
echo [*] Checking and freeing port 3000 and 24678 if occupied...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort 3000, 24678 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" 2>nul

echo.
echo [*] Launching NetSentinel Web Server and Security Engine...
echo [*] Server will be available at: http://localhost:3000
echo.

rem Run development server using npm run dev
call npm run dev

if errorlevel 1 (
    echo.
    echo ==================================================================
    echo [ERROR] Dev server exited or failed to start.
    echo Attempting direct execution via npx tsx server.ts...
    echo ==================================================================
    call npx --yes tsx server.ts
)

echo.
echo Press any key to exit...
pause >nul
