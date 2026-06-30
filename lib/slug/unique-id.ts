const SLUG_PREFIX_RE = /[^a-z0-9]+/g;

/** 영문 접두사만 허용 (한글·특수문자 제거) */
export function normalizeSlugPrefix(prefix: string, fallback = "place"): string {
  const value = prefix.trim().toLowerCase().replace(SLUG_PREFIX_RE, "");
  return value || fallback;
}

/**
 * 상세 페이지용 고유 slug — 영문 접두사 + 숫자 ID (업체명·한글 미포함)
 * 예: academy-1730456789123456, hospital-1730456789456789, breed-1730456789789012
 */
export function generateUniqueSlug(prefix: string): string {
  const head = normalizeSlugPrefix(prefix);
  const id = `${Date.now()}${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")}`;
  return `${head}-${id}`;
}

/** slug가 새 ID 형식(영문-숫자)인지 대략 판별 */
export function isNumericIdSlug(slug: string): boolean {
  return /^[a-z][a-z0-9]*-\d{10,}$/.test(slug);
}
