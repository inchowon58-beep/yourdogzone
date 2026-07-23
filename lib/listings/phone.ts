/**
 * 한국 전화번호 정규화·선택 (네이버 플레이스 임포트용)
 * 서버 전용 모듈과 분리해 테스트·재사용 가능하게 둠.
 */

const MOBILE_PREFIX = /^(010|011|016|017|018|019)$/;
const AREA_PREFIX =
  /^(02|031|032|033|041|042|043|044|051|052|053|054|055|061|062|063|064)$/;

export function normalizeKoreanPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 12) return null;

  // 050x 안심번호 (12자리) — 네이버 지도에 가장 잘 노출됨
  if (digits.startsWith("050") && digits.length === 12) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
  }

  // 02 서울
  if (digits.startsWith("02")) {
    if (digits.length === 9) {
      return `02-${digits.slice(2, 5)}-${digits.slice(5)}`;
    }
    if (digits.length === 10) {
      return `02-${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return null;
  }

  // 휴대폰 11자리
  if (digits.length === 11) {
    const pref = digits.slice(0, 3);
    if (!MOBILE_PREFIX.test(pref) && !AREA_PREFIX.test(pref)) return null;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }

  // 지역번호 10자리 (031-xxx-xxxx 등)
  if (digits.length === 10) {
    const pref3 = digits.slice(0, 3);
    if (!AREA_PREFIX.test(pref3) && !MOBILE_PREFIX.test(pref3)) return null;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // 지역번호 9자리 (일부 구형)
  if (digits.length === 9) {
    const pref3 = digits.slice(0, 3);
    if (!AREA_PREFIX.test(pref3)) return null;
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  }

  return null;
}

function phoneScore(formatted: string): number {
  const digits = formatted.replace(/\D/g, "");
  let score = digits.length * 10;
  if (digits.startsWith("050")) score += 200;
  else if (digits.startsWith("010")) score += 80;
  else if (digits.startsWith("02")) score += 40;
  return score;
}

export function pickBestPhone(...values: unknown[]): string | null {
  const found: string[] = [];
  const push = (s: string) => {
    const n = normalizeKoreanPhone(s);
    if (n && !found.includes(n)) found.push(n);
  };

  for (const v of values) {
    if (typeof v !== "string" || !v.trim()) continue;
    push(v.trim());
    const matches =
      v.match(
        /0(?:50\d|1[016789]|2|3[1-3]|4[1-4]|5[1-5]|6[1-4])[-\s]?\d{3,4}[-\s]?\d{4}/g
      ) ?? [];
    for (const m of matches) push(m);
  }

  if (found.length === 0) return null;
  return [...found].sort((a, b) => phoneScore(b) - phoneScore(a))[0];
}
