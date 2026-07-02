import "server-only";

import { getAdjacentLabels } from "@/lib/constants/region-adjacency";
import { filterAcademies } from "@/lib/academy/academy-index";
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

  add({
    region: regionBig ?? "전체",
    query,
    sourceLabel: label,
  });

  if (regionBig && regionBig !== "전체") {
    add({ region: regionBig, sourceLabel: regionBig });
  }

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

/** 지역 키워드에 맞는 학원 — 없으면 광역·인근 순으로 확장 (메모리 필터) */
export function fetchRegionalAcademiesWithFallback(
  page: RegionalLandingPage,
  allAcademies: Academy[]
): RegionalAcademyFallback {
  const label = page.label.trim();

  for (const step of buildRegionalSearchSteps(page)) {
    const academies = filterAcademies(allAcademies, {
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

/** 인근 인증 추천 학원 — 메모리 필터 */
export function fetchNearbyPremiumWithFallback(
  page: RegionalLandingPage,
  allAcademies: Academy[],
  limit = 3
): { academies: Academy[]; sourceLabel?: string } {
  const seen = new Set<string>();
  const result: Academy[] = [];
  let sourceLabel: string | undefined;

  for (const step of buildRegionalSearchSteps(page)) {
    if (result.length >= limit) break;

    const items = filterAcademies(allAcademies, {
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
