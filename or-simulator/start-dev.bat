@echo off
cd /d %~dp0
node --version
if errorlevel 1 (
  echo Node.js 20 or newer is required.
  pause
  exit /b 1
)
npm run serve
