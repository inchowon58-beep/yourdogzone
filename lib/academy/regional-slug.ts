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

const KEYWORD_NOISE =
  /애견미용학원|애견미용|반려견\s*미용|미용학원|미용\s*학원|반려견|강아지|학원/g;

/** 키워드에서 지역 라벨 추출 (예: "안산 애견미용학원" → "안산") */
export function parseLabelFromKeyword(keyword: string): string {
  let text = keyword.trim().replace(KEYWORD_NOISE, " ");
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

/** 영문 슬러그 생성: ansan-dog-grooming-academy */
export function buildRegionalSlug(label: string): string {
  const base = romanizeLabel(label);
  return `${base}-dog-grooming-academy`;
}

export function isEnglishRegionalSlug(slug: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
}
