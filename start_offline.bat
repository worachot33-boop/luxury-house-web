@echo off
chcp 65001 >nul
set PORT=4001
title THE AURELIA RESIDENCE - Luxury House Web Server (Port %PORT%)
echo ========================================================
echo   THE AURELIA RESIDENCE (Full-Stack Offline Ready)
echo   Running on http://localhost:%PORT%/
echo ========================================================
cd /d "%~dp0"
start "" http://localhost:%PORT%/
node --no-warnings server.js
pause

