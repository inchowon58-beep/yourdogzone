import { inferRegionBig } from "@/lib/academy/region-metro";

function normalizeAdjacencyKey(label: string): string {
  return label
    .trim()
    .replace(/(역|동|구|시|군|읍|면)$/u, "")
    .trim();
}

/** 지역별 근방 지역 (최대 5곳, 라벨 기준) */
export const REGION_ADJACENCY: Record<string, string[]> = {
  부평: ["인천", "부천", "김포", "서울", "시흥"],
  송내: ["부천", "인천", "서울", "김포", "안양"],
  안산: ["시흥", "화성", "광명", "부천", "수원"],
  부천: ["인천", "서울", "광명", "안산", "김포"],
  인천: ["부천", "김포", "서울", "안산", "시흥"],
  수원: ["용인", "화성", "안산", "성남", "오산"],
  성남: ["서울", "용인", "수원", "광주시", "하남"],
  강남: ["서울", "성남", "송파", "서초", "용인"],
  고양: ["서울", "파주", "김포", "의정부", "양주"],
  용인: ["수원", "성남", "화성", "이천", "광주시"],
  화성: ["안산", "수원", "용인", "오산", "평택"],
  시흥: ["안산", "인천", "광명", "부천", "화성"],
  광명: ["부천", "안산", "서울", "시흥", "인천"],
  평택: ["안성", "오산", "화성", "천안", "수원"],
  김포: ["인천", "부천", "고양", "파주", "서울"],
  의정부: ["양주", "구리", "서울", "남양주", "고양"],
  파주: ["고양", "김포", "양주", "의정부", "연천"],
  서울: ["경기", "인천", "성남", "고양", "부천"],
  관악: ["서울", "부천", "경기", "인천", "성남"],
  은평: ["서울", "고양", "종로", "마포", "서대문"],
  광진: ["서울", "성남", "송파", "강남", "경기"],
  분당: ["성남", "용인", "서울", "수원", "광주시"],
  일산: ["고양", "파주", "서울", "김포", "의정부"],
  천안: ["아산", "평택", "공주", "서산", "당진"],
  창원: ["김해", "양산", "진주", "거제", "밀양"],
};

export function getAdjacentLabels(label: string, limit = 5): string[] {
  const trimmed = label.trim();
  const key = normalizeAdjacencyKey(trimmed);
  const list =
    REGION_ADJACENCY[trimmed] ??
    REGION_ADJACENCY[key] ??
    [];

  if (list.length > 0) return list.slice(0, limit);

  const metro = inferRegionBig(trimmed);
  if (metro && metro !== trimmed && metro !== key) {
    return (REGION_ADJACENCY[metro] ?? []).slice(0, limit);
  }

  return [];
}
