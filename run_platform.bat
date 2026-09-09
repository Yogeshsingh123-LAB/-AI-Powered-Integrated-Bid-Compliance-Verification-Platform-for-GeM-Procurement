@echo off
setlocal
title BidVerify Platform runner
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0run_platform.ps1"
set "launcher_exit=%ERRORLEVEL%"
pause
exit /b %launcher_exit%
