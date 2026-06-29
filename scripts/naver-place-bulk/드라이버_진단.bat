@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Chrome 드라이버 진단...
pip install -q -U selenium webdriver-manager
python -c "from naver_crawler import _find_chrome_binary, create_chrome_driver; p=_find_chrome_binary(); print('Chrome:', p or 'NOT FOUND'); d=create_chrome_driver(headless=True); d.get('https://www.google.com'); print('OK: driver works'); d.quit()"
pause
