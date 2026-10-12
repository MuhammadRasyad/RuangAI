@echo off
REM Menghentikan proses Node milik DailyAI saja (proses node lain tidak disentuh)
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object { $_.CommandLine -match 'dailyai' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force; Write-Output ('Dihentikan: PID ' + $_.ProcessId) }"
pause
