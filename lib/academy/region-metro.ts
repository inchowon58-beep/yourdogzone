import { REGION_BIG_OPTIONS } from "@/lib/constants/regions";

const REGION_BIG_SET = new Set<string>(REGION_BIG_OPTIONS);

/** 광역시·도 이름 (region_big) */
export function isMetroRegion(label: string): boolean {
  return REGION_BIG_SET.has(label) && label !== "전체";
}

/** 구·동·역 키워드 → 소속 광역 (region_big) */
const DISTRICT_TO_METRO: Record<string, string> = {
  // 인천
  부평: "인천",
  계양: "인천",
  서구: "인천",
  미추홀: "인천",
  남동: "인천",
  연수: "인천",
  송도: "인천",
  // 경기 (부천·김포 등)
  송내: "경기",
  중동: "경기",
  상동: "경기",
  // 서울 대표 구
  강남: "서울",
  강북: "서울",
  송파: "서울",
  마포: "서울",
  노원: "서울",
  서초: "서울",
  영등포: "서울",
  관악: "서울",
  은평: "서울",
  광진: "서울",
  용산: "서울",
  동작: "서울",
  구로: "서울",
  금천: "서울",
  동대문: "서울",
  중랑: "서울",
  성북: "서울",
  도봉: "서울",
  양천: "서울",
  강서: "서울",
  종로: "서울",
  중구: "서울",
  성동: "서울",
  서대문: "서울",
  // 경기 시·권
  분당: "경기",
  일산: "경기",
  수원: "경기",
  성남: "경기",
  안양: "경기",
  군포: "경기",
  의정부: "경기",
  고양: "경기",
  용인: "경기",
  화성: "경기",
  시흥: "경기",
  광명: "경기",
  부천: "경기",
  안산: "경기",
  평택: "경기",
  김포: "경기",
  파주: "경기",
};

function normalizeDistrictKey(label: string): string {
  return label
    .trim()
    .replace(/(역|동|구|시|군|읍|면|리)$/u, "")
    .trim();
}

/** 지역 라벨에서 region_big 추론 */
export function inferRegionBig(label: string): string | undefined {
  const trimmed = label.trim();
  if (isMetroRegion(trimmed)) return trimmed;

  const key = normalizeDistrictKey(trimmed);
  if (DISTRICT_TO_METRO[key]) return DISTRICT_TO_METRO[key];
  if (DISTRICT_TO_METRO[trimmed]) return DISTRICT_TO_METRO[trimmed];

  return undefined;
}
