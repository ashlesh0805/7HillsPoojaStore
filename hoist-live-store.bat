@echo off
title 7 Hills Pooja Store — Live Public Hoisting
color 0E
echo ====================================================================
echo   7 HILLS POOJA STORE — LIVE ONLINE HOISTING
echo ====================================================================
echo.
echo Starting local Node.js server...
start "7 Hills Server" /b node server.js
timeout /t 2 /nobreak >nul
echo.
echo Starting Cloudflare Live HTTPS Tunnel...
echo.
.\cloudflared.exe tunnel --url http://localhost:3000
pause
