@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Chrome / 드라이버 진단

python -c "from naver_crawler import get_chrome_major_version, start_naver_browser; m=get_chrome_major_version(); print('Chrome major:', m or 'UNKNOWN'); d=start_naver_browser(); print('URL:', d.current_url); print('OK'); d.quit()"

pause
