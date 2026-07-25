import type { RegionalServiceCategory } from "@/lib/seo/regional-service-config";
import { getRegionalServiceConfig } from "@/lib/seo/regional-service-config";

/** 한글 지역명 → 영문 슬러그 (URL용) */
const ROMANIZE: Record<string, string> = {
  서울: "seoul",
  경기: "gyeonggi",
  인천: "incheon",
  부산: "busan",
  대구: "daegu",
  광주: "gwangju",
  대전: "daejeon",
  울산: "ulsan",
  세종: "sejong",
  강남: "gangnam",
  강북: "gangbuk",
  강서: "gangseo",
  강동: "gangdong",
  송파: "songpa",
  마포: "mapo",
  노원: "nowon",
  안산: "ansan",
  부천: "bucheon",
  부평: "bupyeong",
  수원: "suwon",
  성남: "seongnam",
  고양: "goyang",
  용인: "yongin",
  화성: "hwaseong",
  시흥: "siheung",
  광명: "gwangmyeong",
  평택: "pyeongtaek",
  김포: "gimpo",
  의정부: "uijeongbu",
  파주: "paju",
  남양주: "namyangju",
  안양: "anyang",
  군포: "gunpo",
  하남: "hanam",
  오산: "osan",
  이천: "icheon",
  안성: "anseong",
  의왕: "uiwang",
  양주: "yangju",
  구리: "guri",
  포천: "pocheon",
  동두천: "dongducheon",
  과천: "gwacheon",
  연천: "yeoncheon",
  가평: "gapyeong",
  양평: "yangpyeong",
  여주: "yeoju",
  광주시: "gwangju-si",
  분당: "bundang",
  송내: "songnae",
  일산: "ilsan",
  창원: "changwon",
  천안: "cheonan",
  청주: "cheongju",
  전주: "jeonju",
  제주: "jeju",
};

/** 키워드에서 지역 라벨 추출 */
export function parseLabelFromKeyword(
  keyword: string,
  category: RegionalServiceCategory = "academy"
): string {
  const noise = getRegionalServiceConfig(category).keywordNoise;
  let text = keyword.trim().replace(noise, " ");
  text = text.replace(/\s+/g, " ").trim();
  if (!text) return keyword.trim().split(/\s+/)[0] ?? "";
  return text.split(/\s+/)[0] ?? text;
}

export function romanizeLabel(label: string): string {
  const key = label.trim();
  if (ROMANIZE[key]) return ROMANIZE[key];
  const ascii = key
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (ascii) return ascii;
  return `region-${Buffer.from(key, "utf8").toString("hex").slice(0, 12)}`;
}

/** 영문 슬러그 생성 (카테고리별 suffix) — 기본 주소 */
export function buildRegionalSlug(
  label: string,
  category: RegionalServiceCategory = "academy"
): string {
  const base = romanizeLabel(label);
  const suffix = getRegionalServiceConfig(category).slugSuffix;
  return `${base}-${suffix}`;
}

/** 7자리 숫자 — 문서 URL 중복 최소화 */
function randomSevenDigits(): string {
  return String(Math.floor(Math.random() * 10_000_000)).padStart(7, "0");
}

/**
 * 기본주소 + 7자리 숫자.
 * 예: songtan-dog-shelter-1847293
 */
export function buildUniqueRegionalSlug(
  label: string,
  category: RegionalServiceCategory,
  takenSlugs: Iterable<string>
): string {
  const taken = new Set(takenSlugs);
  const base = buildRegionalSlug(label, category);

  for (let i = 0; i < 80; i += 1) {
    const candidate = `${base}-${randomSevenDigits()}`;
    if (!taken.has(candidate)) return candidate;
  }

  // 극히 드문 충돌 — 시간 섞어 재시도
  return `${base}-${Date.now().toString().slice(-7)}`;
}

export function isRegionalSlugVariant(
  slug: string,
  label: string,
  category: RegionalServiceCategory
): boolean {
  return slug !== buildRegionalSlug(label, category);
}

export function isEnglishRegionalSlug(slug: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
}
