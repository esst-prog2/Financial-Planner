@echo off
cd /d "%~dp0"
start "Expense Overview server" cmd /c "npm.cmd run serve"
timeout /t 2 /nobreak >nul
start "" http://localhost:5173/promo/index.html
