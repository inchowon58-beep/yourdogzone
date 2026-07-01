/**
 * SEO 근방 지역 — 구·동 단위 (광역시·도 단위 아님)
 * 지역 랜딩 페이지 본문·메타·JSON-LD에 노출해 연관 검색어 커버
 */
export const REGION_NEARBY_DISTRICTS: Record<string, string[]> = {
  // 인천 부평권
  부평: ["삼산동", "부평동", "청천동", "갈산동", "십정동"],
  삼산동: ["부평동", "청천동", "갈산동", "십정동", "부개동"],
  // 부천
  부천: ["중동", "상동", "심곡동", "소사동", "역곡동"],
  송내: ["중동", "상동", "심곡동", "소사동", "역곡동"],
  // 인천 광역
  인천: ["부평구", "남동구", "연수구", "계양구", "서구"],
  // 서울 강남권
  강남: ["신사동", "논현동", "역삼동", "삼성동", "대치동"],
  송파: ["잠실동", "문정동", "방이동", "석촌동", "가락동"],
  서초: ["서초동", "반포동", "방배동", "양재동", "잠원동"],
  // 경기 안산·시흥
  안산: ["고잔동", "선부동", "와동", "중앙동", "본오동"],
  시흥: ["정왕동", "신천동", "은행동", "장현동", "월곶동"],
  // 경기 수원·성남
  수원: ["영통동", "광교동", "매탄동", "장안구", "팔달구"],
  성남: ["분당", "판교동", "서현동", "야탑동", "이매동"],
  분당: ["서현동", "야탑동", "이매동", "정자동", "수내동"],
  // 경기 북부
  고양: ["일산동", "백석동", "화정동", "탄현동", "대화동"],
  일산: ["일산동", "백석동", "정발산동", "주엽동", "탄현동"],
  // 경기 남부
  용인: ["기흥구", "수지구", "죽전동", "동백동", "보정동"],
  화성: ["동탄", "병점동", "향남읍", "봉담읍", "남양읍"],
  // 기타 광역
  광명: ["철산동", "하안동", "소하동", "광명동", "일직동"],
  김포: ["장기동", "구래동", "운양동", "사우동", "풍무동"],
  평택: ["비전동", "용이동", "세교동", "지제동", "안중읍"],
  천안: ["불당동", "쌍용동", "신부동", "성정동", "백석동"],
  창원: ["상남동", "성주동", "의창구", "마산합포구", "진해구"],
};

function normalizeDistrictKey(label: string): string {
  return label
    .trim()
    .replace(/(역|동|구|시|군|읍|면)$/u, "")
    .trim();
}

/** 구·동 단위 근방 5곳 (SEO용) */
export function getNearbyDistricts(label: string, limit = 5): string[] {
  const trimmed = label.trim();
  const key = normalizeDistrictKey(trimmed);
  const list =
    REGION_NEARBY_DISTRICTS[trimmed] ??
    REGION_NEARBY_DISTRICTS[key] ??
    [];
  return list.slice(0, limit);
}

/** 근방 지역 SEO 키워드 */
export function buildNearbyDistrictKeywords(areas: string[]): string[] {
  const keywords: string[] = [];
  for (const area of areas) {
    keywords.push(
      `${area} 애견미용학원`,
      `${area} 애견미용`,
      `${area} 반려견 미용학원`
    );
  }
  return keywords;
}
