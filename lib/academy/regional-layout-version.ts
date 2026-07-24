import type { RegionalLandingPage } from "@/lib/types/regional-landing";
import { resolvePageCategory } from "@/lib/seo/regional-service-config";

/** 보호소 SEO 레이아웃 버전 */
export type RegionalLayoutVersion = "v1" | "v2";

/**
 * v1 — 기존 RegionalAcademySeoSection (seoBlocks 본문)
 * v2 — ShelterRegionalTrustGuide (로컬 SEO 발행 전용)
 * 필드 없음(기존 발행분) → v1
 */
export function resolveRegionalLayoutVersion(
  page: Pick<RegionalLandingPage, "layoutVersion">
): RegionalLayoutVersion {
  if (page.layoutVersion === "v2") return "v2";
  return "v1";
}

/** 보호소 + 로컬 SEO(v2) 일 때만 새 신뢰 가이드 UI */
export function isShelterTrustLayout(
  page: Pick<RegionalLandingPage, "layoutVersion" | "category">
): boolean {
  return (
    resolvePageCategory(page) === "shelter" &&
    resolveRegionalLayoutVersion(page) === "v2"
  );
}
