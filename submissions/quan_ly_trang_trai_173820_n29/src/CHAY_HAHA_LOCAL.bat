@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
title HaHa Farm - Local

where node >nul 2>&1
if errorlevel 1 (
  echo [LOI] Chua cai Node.js.
  echo Hay cai Node.js 22 LTS hoac moi hon, sau do chay lai file nay.
  echo https://nodejs.org/
  pause
  exit /b 1
)

node scripts\run-local.mjs

if errorlevel 1 (
  echo.
  echo HaHa Farm chua khoi dong duoc. Hay xem HUONG_DAN_CHAY_LOCAL.md.
  pause
)

endlocal
