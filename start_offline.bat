@echo off
chcp 65001 >nul
set PORT=4001
title THE AURELIA RESIDENCE - Luxury House Web Server (Port %PORT%)
echo ========================================================
echo   THE AURELIA RESIDENCE (Full-Stack Offline Ready)
echo   Local PC URL : http://localhost:%PORT%/
echo   Mobile Wi-Fi : http://192.168.1.40:%PORT%/ (เปิดบนมือถือผ่าน Wi-Fi)
echo ========================================================
cd /d "%~dp0"
start "" http://localhost:%PORT%/
node --no-warnings server.js
pause

