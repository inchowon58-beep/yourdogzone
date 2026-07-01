import "server-only";

import { getNearbyDistricts } from "@/lib/constants/region-nearby-districts";
import {
  formatStationName,
  getNearbyStations,
} from "@/lib/constants/region-nearby-stations";
import type { RegionalLandingPage } from "@/lib/types/regional-landing";

/** 페이지에 저장된 근방 구·동 또는 라벨 기준 자동 추론 (최대 5) */
export function resolveNearbyAreas(page: RegionalLandingPage): string[] {
  const stored = page.nearbyAreas?.filter((a) => a?.trim()).slice(0, 5);
  if (stored && stored.length > 0) return stored;
  return getNearbyDistricts(page.label, 5);
}

/** 페이지에 저장된 인근 지하철역 또는 라벨 기준 자동 추론 (최대 5) */
export function resolveNearbyStations(page: RegionalLandingPage): string[] {
  const stored = page.nearbyStations
    ?.filter((s) => s?.trim())
    .map(formatStationName)
    .slice(0, 5);
  if (stored && stored.length > 0) return stored;
  return getNearbyStations(page.label, 5);
}
