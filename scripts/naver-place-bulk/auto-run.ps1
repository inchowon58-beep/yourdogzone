# YourDogZone 자동 수집·등록 (Windows)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "[필수] .env 생성됨 → ACADEMY_ADMIN_SECRET 입력 후 다시 실행" -ForegroundColor Yellow
    notepad .env
    exit 1
}

if (-not (Test-Path "config.json")) {
    Copy-Item "config.example.json" "config.json"
    Write-Host "[필수] config.json 생성됨 → 검색어 수정 후 다시 실행" -ForegroundColor Yellow
    notepad config.json
    exit 1
}

Write-Host "패키지 설치 (최초 1회 수 분)..." -ForegroundColor Cyan
pip install -q -r requirements.txt

Write-Host ""
Write-Host "네이버 검색 → 수집 → Gemini 가공 → 사이트 등록 시작" -ForegroundColor Cyan
Write-Host "(Chrome 브라우저가 자동으로 열립니다)" -ForegroundColor Gray
Write-Host ""

python auto_crawl_register.py --config config.json

Write-Host ""
Read-Host "엔터를 누르면 종료"
