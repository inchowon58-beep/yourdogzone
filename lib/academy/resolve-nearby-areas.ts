import "server-only";

import { getNearbyDistricts } from "@/lib/constants/region-nearby-districts";
import {
  formatStationName,
  getNearbyStations,
} from "@/lib/constants/region-nearby-stations";
import type { RegionalLandingPage } from "@/lib/types/regional-landing";

/** 페이지 라벨 기준 근방 구·동 (상수 → 없으면 해당 지역만) */
export function resolveNearbyAreas(page: RegionalLandingPage): string[] {
  const stored = page.nearbyAreas?.filter((a) => a?.trim()).slice(0, 5);
  if (stored && stored.length > 0) return stored;
  const inferred = getNearbyDistricts(page.label, 5);
  if (inferred.length > 0) return inferred;
  return [page.label.trim()];
}

/** 페이지 라벨 기준 인근 역 (상수 → 없으면 해당 지역역) */
export function resolveNearbyStations(page: RegionalLandingPage): string[] {
  const stored = page.nearbyStations
    ?.filter((s) => s?.trim())
    .map(formatStationName)
    .slice(0, 5);
  if (stored && stored.length > 0) return stored;
  const inferred = getNearbyStations(page.label, 5);
  if (inferred.length > 0) return inferred;
  const label = page.label.trim();
  return label.endsWith("역") ? [label] : [`${label}역`];
}
