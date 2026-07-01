import { REGION_BIG_OPTIONS } from "@/lib/constants/regions";
import { getAdjacentLabels } from "@/lib/constants/region-adjacency";
import {
  buildRegionalSlug,
  parseLabelFromKeyword,
} from "@/lib/academy/regional-slug";
import { getAllRegionalLandings } from "@/lib/academy/regional-store";
import type { RegionalLandingInsert } from "@/lib/types/regional-landing";

const REGION_BIG_SET = new Set<string>(REGION_BIG_OPTIONS);

function inferRegionBig(label: string): string | undefined {
  if (REGION_BIG_SET.has(label)) return label;
  const metro: Record<string, string> = {
    강남: "서울",
    강북: "서울",
    송파: "서울",
    분당: "경기",
    일산: "경기",
  };
  return metro[label];
}

function buildRegionInfo(label: string, regionBig?: string): string {
  const region = regionBig ? `${regionBig} ` : "";
  return `${label}은(는) ${region}권에서 반려견 가구가 많고 애견미용·자격증 교육 수요가 꾸준한 지역입니다. ${label} 지역 애견미용학원은 통학 거리, 실습견 환경, 국비지원 과정, 수강료를 기준으로 비교하는 것이 좋습니다. 유아독존에서는 ${label}에 등록된 학원 정보와 인증 추천 학원을 한곳에서 확인할 수 있습니다.`;
}

function buildNearbyIntro(label: string): string {
  return `${label}에서 애견미용학원을 알아보는 분들이 근방에서 함께 검색·방문하는 지역입니다. 통학 거리와 실습 환경을 비교할 때 아래 지역도 함께 살펴보세요.`;
}

/** 키워드 한 줄로 지역 랜딩 페이지 초안 생성 */
export async function generateRegionalLandingFromKeyword(
  keyword: string
): Promise<RegionalLandingInsert> {
  const trimmed = keyword.trim();
  const label = parseLabelFromKeyword(trimmed);
  if (!label) throw new Error("키워드에서 지역명을 추출할 수 없습니다.");

  const slug = buildRegionalSlug(label);
  const regionBig = inferRegionBig(label);
  const query = REGION_BIG_SET.has(label) ? label : label;

  const all = await getAllRegionalLandings({ includeUnpublished: true });
  const byLabel = new Map(all.map((p) => [p.label, p]));

  const adjacent = getAdjacentLabels(label, 5);
  const nearbySlugs = adjacent
    .map((adj) => byLabel.get(adj)?.slug ?? buildRegionalSlug(adj))
    .slice(0, 5);

  return {
    slug,
    label,
    keyword: trimmed.includes("애견") ? trimmed : `${label} 애견미용학원`,
    regionBig,
    query,
    regionInfo: buildRegionInfo(label, regionBig),
    nearbyIntro: buildNearbyIntro(label),
    nearbySlugs,
    isPublished: true,
  };
}
