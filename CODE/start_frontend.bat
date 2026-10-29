@echo off
cd /d %~dp0frontend
npm install --legacy-peer-deps
npm run dev
pause
