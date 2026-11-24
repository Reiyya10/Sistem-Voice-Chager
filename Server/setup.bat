@echo off
cd /d %~dp0
where python >nul 2>nul || (echo Python belum terpasang atau belum ada di PATH. Pasang Python 3.10 dan centang "Add python.exe to PATH". & pause & exit /b 1)
if not exist venv python -m venv venv
call venv\Scripts\activate
python -m pip install "pip>=24" "setuptools<=80.6.0"
python -m pip install -r requirements.txt
python check.py
pause
