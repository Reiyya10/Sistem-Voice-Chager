@echo off
cd /d %~dp0
if exist venv\Scripts\activate (
    call venv\Scripts\activate
)

curl.exe -sS http://127.0.0.1:8000/health >nul 2>&1
if not errorlevel 1 (
    echo Server RVC sudah aktif di port 8000
    echo Tidak perlu menjalankan server kedua kali.
    pause
    exit /b 0
)

python -m uvicorn main:app --host 0.0.0.0 --port 8000 --ws-max-queue 2
pause
