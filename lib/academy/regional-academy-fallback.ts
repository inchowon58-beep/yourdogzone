import "server-only";

import { getAdjacentLabels } from "@/lib/constants/region-adjacency";
import { getAcademies } from "@/lib/academy/queries";
import { inferRegionBig, isMetroRegion } from "@/lib/academy/region-metro";
import type { Academy } from "@/lib/types/academy";
import type { RegionalLandingPage } from "@/lib/types/regional-landing";

export type RegionalAcademyFallback = {
  academies: Academy[];
  isNearbyFallback: boolean;
  /** 인근 노출 시 기준이 된 지역명 (예: 인천, 부천) */
  sourceLabel?: string;
};

type SearchStep = {
  region?: string;
  query?: string;
  sourceLabel: string;
};

function buildRegionalSearchSteps(page: RegionalLandingPage): SearchStep[] {
  const label = page.label.trim();
  const query = page.query ?? label;
  const regionBig = page.regionBig ?? inferRegionBig(label);
  const steps: SearchStep[] = [];
  const seen = new Set<string>();

  const add = (step: SearchStep) => {
    const key = `${step.region ?? "전체"}|${step.query ?? ""}`;
    if (seen.has(key)) return;
    seen.add(key);
    steps.push(step);
  };

  // 1) 해당 하위 지역 정확 검색
  add({
    region: regionBig ?? "전체",
    query,
    sourceLabel: label,
  });

  // 2) 소속 광역 전체 (부평 → 인천 전체)
  if (regionBig && regionBig !== "전체") {
    add({ region: regionBig, sourceLabel: regionBig });
  }

  // 3) 인접 지역 순차 확장 (부평 → 인천 → 부천 → …)
  const adjacent = getAdjacentLabels(label, 8);
  const expansion = [
    ...(regionBig && regionBig !== label ? [regionBig] : []),
    ...adjacent,
  ];

  for (const adj of expansion) {
    if (!adj || adj === label) continue;

    if (isMetroRegion(adj)) {
      add({ region: adj, sourceLabel: adj });
      continue;
    }

    const adjBig = inferRegionBig(adj);
    add({
      region: adjBig ?? "전체",
      query: adj,
      sourceLabel: adj,
    });
    if (adjBig && adjBig !== adj) {
      add({ region: adjBig, sourceLabel: adjBig });
    }
  }

  return steps;
}

/** 지역 키워드에 맞는 학원 조회 — 없으면 광역·인근 순으로 확장 */
export async function fetchRegionalAcademiesWithFallback(
  page: RegionalLandingPage
): Promise<RegionalAcademyFallback> {
  const label = page.label.trim();

  for (const step of buildRegionalSearchSteps(page)) {
    const academies = await getAcademies({
      region: step.region,
      query: step.query,
    });
    if (academies.length === 0) continue;

    const isNearbyFallback = step.sourceLabel !== label;
    return {
      academies,
      isNearbyFallback,
      sourceLabel: isNearbyFallback ? step.sourceLabel : undefined,
    };
  }

  return { academies: [], isNearbyFallback: false };
}

/** 인근 인증 추천 학원 — 지역 페이지 유무와 관계없이 라벨 기준 확장 검색 */
export async function fetchNearbyPremiumWithFallback(
  page: RegionalLandingPage,
  limit = 3
): Promise<{ academies: Academy[]; sourceLabel?: string }> {
  const seen = new Set<string>();
  const result: Academy[] = [];
  let sourceLabel: string | undefined;

  for (const step of buildRegionalSearchSteps(page)) {
    if (result.length >= limit) break;

    const items = await getAcademies({
      region: step.region,
      query: step.query,
    });

    for (const academy of items) {
      if (!academy.is_premium || seen.has(academy.slug)) continue;
      seen.add(academy.slug);
      result.push(academy);
      sourceLabel ??= step.sourceLabel;
      if (result.length >= limit) break;
    }
  }

  return {
    academies: result.sort((a, b) => a.slug.localeCompare(b.slug)).slice(0, limit),
    sourceLabel,
  };
}
