# 네이버 플레이스 → YourDogZone 대량 등록

## 파이프라인

```
[Python Selenium]  네이버 플레이스 크롤링
        ↓
[register_via_api.py]  JSON → Next.js API
        ↓
[/api/admin/bulk-register]
  1. 외부 이미지 다운로드 → R2 업로드 (Presigned URL)
  2. (선택) Gemini API로 소개글 재작성
  3. academy_list 등록 (Supabase 또는 R2 JSON)
```

## 1. Vercel 환경 변수

| 변수 | 설명 |
|------|------|
| `ACADEMY_ADMIN_SECRET` | 대량 등록 API 인증키 (필수) |
| `GEMINI_API_KEY` | 소개글 자동 재작성 (선택) |
| `GEMINI_MODEL` | 기본 `gemini-2.0-flash` |
| R2 관련 변수 | 기존 업로드와 동일 |

## 2. API 사용법

**GET** `https://www.yourdogzone.co.kr/api/admin/bulk-register`  
→ 스키마 및 예시 JSON

**POST** `https://www.yourdogzone.co.kr/api/admin/bulk-register`

헤더:
```
x-admin-secret: {ACADEMY_ADMIN_SECRET}
Content-Type: application/json
```

본문 예시:
```json
{
  "refine_with_gemini": true,
  "items": [
    {
      "name": "OO애견미용학원",
      "address": "경기도 부천시 원미구 ...",
      "phone": "032-000-0000",
      "description": "네이버 원본 소개...",
      "image_urls": ["https://search.pstatic.net/..."]
    }
  ]
}
```

- 한 요청 최대 **5건** (Vercel 타임아웃 고려)
- 이미 R2에 올린 이미지는 `academy_images`, `logo_image`로 직접 전달 가능
- `skip_image_mirror: true` 시 `image_urls` 무시

## 3. Python 실행

```bash
cd scripts/naver-place-bulk
pip install requests python-dotenv

# .env
# YOURDOGZONE_API_URL=https://www.yourdogzone.co.kr
# ACADEMY_ADMIN_SECRET=your-secret

python register_via_api.py --json academies.json --gemini
```

## 4. 로컬에서 R2 직접 업로드 후 등록만 API에 맡기기

Vercel에서 R2 PUT이 실패할 경우, 파이썬에서 boto3로 이미지를 먼저 올리고:

```json
{
  "skip_image_mirror": true,
  "items": [{
    "name": "...",
    "address": "...",
    "logo_image": "https://img.yourdogzone.co.kr/academy/...",
    "academy_images": ["https://img.yourdogzone.co.kr/academy/..."]
  }]
}
```

## 5. 주의사항

- 네이버 이미지·텍스트 무단 복제는 저작권·이용약관 이슈가 있을 수 있습니다.
- Gemini 재가공(`refine_with_gemini`)으로 유사 문서 패널티를 줄이세요.
- 대량 등록 후 `/services/academy/admin`에서 인증 추천 학원을 설정하세요.
