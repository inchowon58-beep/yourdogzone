import { REGION_BIG_OPTIONS } from "@/lib/constants/regions";

const REGION_BIG_SET = new Set<string>(REGION_BIG_OPTIONS);

/** 검색어·지역 탭에서 지역 타겟 라벨 추출 (예: "안산", "경기") */
export function resolveGeoLabel(region: string, query?: string): string | null {
  const cleanedQuery = cleanLocationQuery(query);
  if (cleanedQuery) return cleanedQuery;

  if (region && region !== "전체" && REGION_BIG_SET.has(region)) {
    return region;
  }

  return null;
}

function cleanLocationQuery(query?: string): string | null {
  if (!query?.trim()) return null;

  let text = query.trim();
  text = text.replace(
    /애견미용학원|애견미용|미용학원|미용\s*학원|학원|반려견|강아지/g,
    ""
  );
  text = text.replace(/\s+/g, " ").trim();

  if (!text) return null;
  if (text.length > 20) return text.slice(0, 20);
  return text;
}

export function buildGeoAcademyHeading(
  geoLabel: string | null,
  tabHint: string
): string {
  if (!geoLabel) return `${tabHint} 전국 애견미용학원`;
  return `${tabHint} ${geoLabel} 지역 애견미용학원`;
}
