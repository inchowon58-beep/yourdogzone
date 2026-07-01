import "server-only";

import type { Metadata } from "next";
import type { RegionalLandingPage } from "@/lib/types/regional-landing";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { regionalLandingPath } from "@/lib/academy/regional-path";
import { buildRegionalLandingKeywords } from "@/lib/academy/regional-seo-content";
import { resolveBoundMetaDescription } from "@/lib/academy/regional-seo-resolve";
import type { RegionalSeoContext } from "@/lib/academy/regional-seo-vars";

export function buildRegionalLandingMetadata(
  page: RegionalLandingPage,
  seoCtx: RegionalSeoContext
): Metadata {
  const { region } = seoCtx;
  const path = regionalLandingPath(page);

  const title = seoCtx.hasRecommendedAcademy
    ? `${region} 애견미용학원 · ${seoCtx.recommendedAcademyName} 추천`
    : seoCtx.hasNearbyRecommendedAcademy
      ? `${region} 애견미용학원 · 인근 ${seoCtx.nearbyRecommendedAcademyName} 참고`
      : `${region} 애견미용학원 추천 · ${region} 지역 미용학원 정보`;

  const description = resolveBoundMetaDescription(page, seoCtx);

  const keywords = [
    ...buildRegionalLandingKeywords(region),
    ...(seoCtx.hasRecommendedAcademy
      ? [
          `${region} ${seoCtx.recommendedAcademyName}`,
          `${seoCtx.recommendedAcademyName} 애견미용학원`,
        ]
      : []),
    ...(seoCtx.hasNearbyRecommendedAcademy
      ? [
          `${seoCtx.nearbyRecommendedRegion} ${seoCtx.nearbyRecommendedAcademyName}`,
          `${seoCtx.nearbyRecommendedAcademyName} 애견미용학원`,
        ]
      : []),
  ];

  const imageAlt = seoCtx.hasRecommendedAcademy
    ? `${seoCtx.recommendedAcademyName} ${region} 애견미용학원`
    : seoCtx.hasNearbyRecommendedAcademy
      ? `${seoCtx.nearbyRecommendedAcademyName} 인근 인증 추천 애견미용학원`
      : `${region} 애견미용학원 정보`;

  return buildPageMetadata({
    title,
    description,
    path,
    keywords,
    images: seoCtx.ogImageUrl ? [seoCtx.ogImageUrl] : undefined,
    imageAlt,
  });
}
