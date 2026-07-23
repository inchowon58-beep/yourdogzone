import "server-only";

import type { Metadata } from "next";
import type { RegionalLandingPage } from "@/lib/types/regional-landing";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { regionalLandingPath } from "@/lib/academy/regional-path";
import {
  resolveNearbyAreas,
  resolveNearbyStations,
} from "@/lib/academy/resolve-nearby-areas";
import { resolveBoundMetaDescription } from "@/lib/academy/regional-seo-resolve";
import type { RegionalSeoContext } from "@/lib/academy/regional-seo-vars";
import {
  buildRegionalLandingKeywords,
  getRegionalServiceConfig,
  resolvePageCategory,
} from "@/lib/seo/regional-service-config";

export function buildRegionalLandingMetadata(
  page: RegionalLandingPage,
  seoCtx: RegionalSeoContext
): Metadata {
  const category = resolvePageCategory(page);
  const config = getRegionalServiceConfig(category);
  const { region } = seoCtx;
  const path = regionalLandingPath(page);
  const serviceTitle = config.title;
  const pageKeyword = page.keyword?.trim() || `${region} ${serviceTitle}`;

  const title = seoCtx.hasRecommendedAcademy
    ? `${pageKeyword} · ${seoCtx.recommendedAcademyName}`
    : `${pageKeyword} 추천 · ${region} 지역 ${config.singular} 정보`;

  const nearbyAreas = resolveNearbyAreas(page);
  const nearbyStations = resolveNearbyStations(page);

  const description = [
    resolveBoundMetaDescription(page, seoCtx),
    nearbyAreas.length > 0
      ? `근방 ${nearbyAreas.join(", ")} ${serviceTitle} 검색·비교도 함께 안내합니다.`
      : null,
    nearbyStations.length > 0
      ? `인근 ${nearbyStations.join(", ")} 지하철역 ${serviceTitle}도 함께 안내합니다.`
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  const keywords = [
    pageKeyword,
    ...buildRegionalLandingKeywords(region, category),
    ...nearbyAreas.flatMap((area) => [
      `${area} ${serviceTitle}`,
      `${area} ${config.defaultKeywordSuffix}`,
    ]),
    ...nearbyStations.flatMap((station) => [`${station} ${serviceTitle}`]),
    ...(seoCtx.hasRecommendedAcademy
      ? [
          `${region} ${seoCtx.recommendedAcademyName}`,
          `${seoCtx.recommendedAcademyName} ${serviceTitle}`,
        ]
      : []),
    ...(seoCtx.hasNearbyRecommendedAcademy
      ? [
          `${seoCtx.nearbyRecommendedRegion} ${seoCtx.nearbyRecommendedAcademyName}`,
          `${seoCtx.nearbyRecommendedAcademyName} ${serviceTitle}`,
        ]
      : []),
  ];

  const imageAlt = seoCtx.hasRecommendedAcademy
    ? `${seoCtx.recommendedAcademyName} ${pageKeyword}`
    : seoCtx.hasNearbyRecommendedAcademy
      ? `${seoCtx.nearbyRecommendedAcademyName} 인근 인증 추천 ${config.entityLabel}`
      : `${pageKeyword} 정보`;

  return buildPageMetadata({
    title,
    description,
    path,
    keywords,
    images: page.imageUrl ? [page.imageUrl] : undefined,
    ogSubtitle: config.ogSubtitle,
    imageAlt,
  });
}
