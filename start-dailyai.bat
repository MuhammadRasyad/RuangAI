@echo off
REM Menjalankan RuangAI (Node backend :3000, diakses via http://dailyai.test/ atau http://localhost:3000/)
cd /d C:\laragon\www\dailyai
start "RuangAI" /min node server\index.js
echo RuangAI dijalankan di background.
echo Buka http://dailyai.test/ di browser.
pause
