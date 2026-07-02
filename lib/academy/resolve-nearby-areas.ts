import "server-only";

import { getNearbyDistricts } from "@/lib/constants/region-nearby-districts";
import {
  formatStationName,
  getNearbyStations,
} from "@/lib/constants/region-nearby-stations";
import type { RegionalLandingPage } from "@/lib/types/regional-landing";

function normalizeGeoKey(label: string): string {
  return label
    .trim()
    .replace(/(역|동|구|시|군|읍|면)$/u, "")
    .trim();
}

/** 저장값이 지역명만 반복된 경우(예: 연수구만 5번) → 상수 맵으로 재추론 */
export function isDegenerateGeoList(items: string[], label: string): boolean {
  if (items.length === 0) return true;
  const key = normalizeGeoKey(label);
  return items.every((item) => {
    const trimmed = item.trim();
    return (
      trimmed === label.trim() ||
      normalizeGeoKey(trimmed) === key ||
      trimmed === `${label.trim()}역`
    );
  });
}

/** 페이지 라벨 기준 근방 구·동 */
export function resolveNearbyAreas(page: RegionalLandingPage): string[] {
  const stored = page.nearbyAreas?.filter((a) => a?.trim()).slice(0, 5);
  if (stored && stored.length > 0 && !isDegenerateGeoList(stored, page.label)) {
    return stored;
  }
  const inferred = getNearbyDistricts(page.label, 5);
  if (inferred.length > 0) return inferred;
  return [];
}

/** 페이지 라벨 기준 인근 지하철역 */
export function resolveNearbyStations(page: RegionalLandingPage): string[] {
  const stored = page.nearbyStations
    ?.filter((s) => s?.trim())
    .map(formatStationName)
    .slice(0, 5);
  if (stored && stored.length > 0 && !isDegenerateGeoList(stored, page.label)) {
    return stored;
  }
  return getNearbyStations(page.label, 5);
}

/** R2에 저장된 근방 GEO가 비었거나 잘못된 경우 */
export function pageNeedsNearbyGeoFill(page: RegionalLandingPage): boolean {
  const areas = page.nearbyAreas?.filter((a) => a?.trim()) ?? [];
  const stations = page.nearbyStations?.filter((s) => s?.trim()) ?? [];
  if (areas.length < 3 || stations.length < 3) return true;
  if (isDegenerateGeoList(areas, page.label)) return true;
  if (isDegenerateGeoList(stations, page.label)) return true;
  return false;
}
