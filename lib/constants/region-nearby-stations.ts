/**
 * SEO 인근 지하철역 — 지역 랜딩별 통학·검색 연관 역 5곳
 */
export const REGION_NEARBY_STATIONS: Record<string, string[]> = {
  // 인천 부평권
  부평: ["부평역", "부평구청역", "갈산역", "동암역", "부평시장역"],
  삼산동: ["삼산역", "부평역", "갈산역", "부평구청역", "동암역"],
  // 부천·송내
  부천: ["송내역", "중동역", "부천역", "역곡역", "소사역"],
  송내: ["송내역", "중동역", "부천역", "역곡역", "소사역"],
  // 인천 광역
  인천: ["인천역", "주안역", "부평역", "동춘역", "계양역"],
  // 서울 강남권
  강남: ["강남역", "신논현역", "역삼역", "선릉역", "삼성역"],
  송파: ["잠실역", "석촌역", "가락시장역", "문정역", "방이역"],
  서초: ["서초역", "교대역", "강남역", "양재역", "방배역"],
  // 경기 안산·시흥
  안산: ["중앙역", "고잔역", "상록수역", "한대앞역", "사리역"],
  시흥: ["정왕역", "오이도역", "신천역", "월곶역", "달월역"],
  // 경기 수원·성남
  수원: ["수원역", "영통역", "광교역", "매탄권선역", "망포역"],
  성남: ["서현역", "이매역", "야탑역", "수내역", "정자역"],
  분당: ["서현역", "이매역", "야탑역", "수내역", "정자역"],
  // 경기 북부
  고양: ["화정역", "백석역", "대화역", "일산역", "탄현역"],
  일산: ["일산역", "정발산역", "주엽역", "백석역", "탄현역"],
  // 경기 남부
  용인: ["기흥역", "수지구청역", "죽전역", "동백역", "보정역"],
  화성: ["동탄역", "병점역", "세마역", "오산대역", "향남역"],
  // 기타
  광명: ["광명역", "철산역", "하안역", "소하역", "광명사거리역"],
  김포: ["김포공항역", "풍무역", "양촌역", "구래역", "장기역"],
  평택: ["평택역", "지제역", "비전역", "서정리역", "오산역"],
  천안: ["천안역", "두정역", "불당역", "쌍용역", "신부역"],
  창원: ["창원중앙역", "마산역", "진해역", "남창원역", "북창원역"],
};

function normalizeStationKey(label: string): string {
  return label
    .trim()
    .replace(/(역|동|구|시|군|읍|면)$/u, "")
    .trim();
}

/** 역 이름에 '역' 접미사 보장 */
export function formatStationName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return trimmed;
  return trimmed.endsWith("역") ? trimmed : `${trimmed}역`;
}

/** 인근 지하철역 5곳 (SEO용) */
export function getNearbyStations(label: string, limit = 5): string[] {
  const trimmed = label.trim();
  const key = normalizeStationKey(trimmed);
  const list =
    REGION_NEARBY_STATIONS[trimmed] ??
    REGION_NEARBY_STATIONS[key] ??
    [];
  return list.map(formatStationName).slice(0, limit);
}

/** 인근 역 SEO 키워드 */
export function buildNearbyStationKeywords(stations: string[]): string[] {
  const keywords: string[] = [];
  for (const station of stations) {
    const name = formatStationName(station);
    keywords.push(
      `${name} 애견미용학원`,
      `${name} 애견미용`,
      `${name} 근처 애견미용학원`
    );
  }
  return keywords;
}
