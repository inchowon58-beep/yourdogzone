@echo off
chcp 65001 >nul
cd /d "%~dp0"

set "OUT=dist\유아독존 SEO"

echo [1/4] 패키지 설치...
python -m pip install -r requirements.txt pyinstaller
if errorlevel 1 goto fail

echo [2/4] exe 빌드 중 (수 분 소요)...
python -m PyInstaller build_exe.spec --noconfirm --clean
if errorlevel 1 goto fail

echo [3/4] 배포 폴더 정리...
if not exist "%OUT%" mkdir "%OUT%"
if exist "dist\유아독존 SEO.exe" (
  move /Y "dist\유아독존 SEO.exe" "%OUT%\유아독존 SEO.exe" >nul
)
copy /Y ".env.example" "%OUT%\.env.example" >nul
copy /Y "keywords.example.txt" "%OUT%\keywords.example.txt" >nul
if exist "README.md" copy /Y "README.md" "%OUT%\README.md" >nul
if exist ".env" copy /Y ".env" "%OUT%\.env" >nul
if exist "gui_settings.json" copy /Y "gui_settings.json" "%OUT%\gui_settings.json" >nul

echo.
echo [4/4] 완료
echo   실행: %OUT%\유아독존 SEO.exe
echo   설정: 같은 폴더 .env / gui_settings.json
echo.
pause
exit /b 0

:fail
echo 빌드 실패
pause
exit /b 1
