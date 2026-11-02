@echo off
REM Starts the Aura API at http://0.0.0.0:8000/api
REM "-d extension=pdo_mysql" turns on the MySQL driver even if php.ini has it commented out.
cd /d "%~dp0"
if not exist .env (
  copy .env.example .env >nul
  echo Created backend\.env from .env.example - edit it to set DB_PASS and GEMINI_API_KEY.
)
echo Aura API running on http://localhost:8000/api  (Ctrl+C to stop)
php -d extension=pdo_mysql -S 0.0.0.0:8000 -t public public/index.php
