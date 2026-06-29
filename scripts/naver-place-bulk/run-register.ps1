# YourDogZone 학원 대량 등록 (Windows)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host ""
    Write-Host "[필수] .env 파일이 생성되었습니다." -ForegroundColor Yellow
    Write-Host "      .env 를 열어 ACADEMY_ADMIN_SECRET 값을 Vercel과 동일하게 넣은 뒤 다시 실행하세요." -ForegroundColor Yellow
    notepad .env
    exit 1
}

if (-not (Test-Path "academies.json")) {
    Copy-Item "academies.template.json" "academies.json"
    Write-Host ""
    Write-Host "[필수] academies.json 이 생성되었습니다." -ForegroundColor Yellow
    Write-Host "      학원 정보를 채운 뒤 다시 실행하세요." -ForegroundColor Yellow
    notepad academies.json
    exit 1
}

Write-Host "패키지 설치 중..." -ForegroundColor Cyan
pip install -q -r requirements.txt

Write-Host "등록 API 호출 중 (Gemini 재가공 사용)..." -ForegroundColor Cyan
python register_via_api.py --json academies.json --gemini

Write-Host ""
Write-Host "완료. https://www.yourdogzone.co.kr/services/academy 에서 확인하세요." -ForegroundColor Green
