@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 유아독존 - 애견미용학원 자동등록

echo 패키지 확인 중...
pip install -q -r requirements.txt

echo GUI 실행...
python gui_app.py
pause
