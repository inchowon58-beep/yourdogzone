import "server-only";

import type { Metadata } from "next";
import type { RegionalLandingPage } from "@/lib/types/regional-landing";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { regionalLandingPath } from "@/lib/academy/regional-path";
import { buildRegionalLandingKeywords } from "@/lib/academy/regional-seo-content";

export function buildRegionalLandingMetadata(
  page: RegionalLandingPage
): Metadata {
  const { label } = page;
  const path = regionalLandingPath(page);

  return buildPageMetadata({
    title: `${label} 애견미용학원 추천 · ${label} 지역 미용학원 정보`,
    description:
      page.metaDescription?.slice(0, 160) ??
      page.regionInfo?.slice(0, 155) ??
      `${label}에서 애견미용 자격증을 준비한다면? ${label} 지역 애견미용학원의 수강료·국비지원·실습 환경·인증 추천 학원을 한곳에서 비교하세요.`,
    path,
    keywords: buildRegionalLandingKeywords(label),
  });
}
