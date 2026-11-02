@echo off
REM Starts the Aura backend (PHP API on port 8000) and the Expo frontend in two windows.
REM MySQL must already be running.
cd /d "%~dp0"
start "Aura API" cmd /k "cd /d backend && start-server.bat"
start "Aura App" cmd /k "cd /d frontend && npx expo start"
echo Started. In the "Aura App" window press w to open the app in your browser.
