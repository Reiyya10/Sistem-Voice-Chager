@echo off
cd /d %~dp0
call venv\Scripts\activate
uvicorn main:app --port 8000 --ws-max-queue 2
pause
