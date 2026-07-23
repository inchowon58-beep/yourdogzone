# 유아독존 지역 SEO 대량 발행 (오프라인)

Gemini 없이 **카테고리별 기본 템플릿 + 페이지별 문장 변형**으로 지역 SEO 랜딩을 만들고, 관리자 API로 사이트에 발행합니다. 발행 후 네이버 서치어드바이저 웹문서 등록(최대 50건)도 이어서 할 수 있습니다.

## 준비

관리자 비밀키(`ACADEMY_ADMIN_SECRET`)는 Vercel / 로컬 `.env.local` 과 동일한 값입니다.  
`scripts/seo-publisher/.env` 는 로컬 설정에서 자동 복사해 두면 됩니다.

웹문서 등록용 네이버 아이디·비밀번호는 GUI에 입력란이 있습니다.  
실행 시 Chrome이 열리고 로그인 → 서치어드바이저에서 사이트 웹문서 등록(최대 50)까지 진행합니다.

의존성:

```bat
cd scripts\seo-publisher
pip install -r requirements.txt
pip install -r C:\Users\USER\Desktop\VM웹문서자동등록\requirements.txt
```

## 실행파일 (exe)

```bat
scripts\seo-publisher\build_exe.bat
```

완료 후: `scripts\seo-publisher\dist\유아독존 SEO\유아독존 SEO.exe`  
바로가기: `유아독존_SEO_실행.bat`

exe와 같은 폴더의 `.env` / `gui_settings.json` 을 사용합니다.

## GUI 실행 (개발)

```bat
scripts\seo-publisher\run_gui.bat
```

또는 `python app_gui.py`

1. 카테고리 선택 (기본: **shelter — 강아지보호소**)  
2. **이미지 폴더 URL** + 오른쪽 **최대번호** (예: `https://image.cattery.co.kr/dogboho/` + `79` → `01.webp`~`79.webp` 랜덤)  
3. 키워드 붙여넣기 (한 줄에 하나, 예: `안산 강아지보호소`)  
4. **사이트에 발행 (API)** / **IndexNow** 체크  
5. 필요 시 **웹문서 등록 (최대 50건)** 체크  
6. **생성 · 발행 실행** (설정은 자동 저장)

## CLI

```bat
python publish.py --category shelter --keywords keywords.example.txt
python publish.py --category shelter --keywords keywords.txt --webdoc --webdoc-limit 50
python publish.py --category shelter --keywords keywords.txt --no-publish
```

## 동작 요약

| 단계 | 내용 |
|------|------|
| 생성 | 보호소 기본 문안을 키워드 해시로 문단·FAQ·메타를 변형 |
| 발행 | `POST /api/admin/regional-landings` `action=upsert_batch` (최대 40개/요청) |
| IndexNow | `/api/indexnow` 로 생성 URL 일괄 전송 |
| 웹문서 | `VM웹문서자동등록`의 `naver_searchadvisor.submit_crawl_urls` 호출, 최대 50건 |

생성 URL 목록은 `scripts/seo-publisher/output/last_urls_{category}.txt` 에 저장됩니다.

## 유사문서 완화

동일 기본 골격을 쓰되, 키워드마다 다른 도입문·소제목 세트·문단 순서·FAQ 표현을 섞어 페이지 간 텍스트 중복을 줄입니다. 완벽한 유일성은 아니므로 키워드·지역이 겹치지 않게 등록하는 것이 좋습니다.
