@echo off
setlocal
title BidVerify Platform runner
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0run_platform.ps1"
set "launcher_exit=%ERRORLEVEL%"
if %launcher_exit% neq 0 (
    echo.
    echo Platform startup failed with exit code %launcher_exit%.
    pause
)
exit /b %launcher_exit%
