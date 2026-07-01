import "server-only";

import type { RegionalLandingPage } from "@/lib/types/regional-landing";
import {
  bindRegionalFaqItems,
  bindRegionalSeoBlocks,
  bindRegionalSeoText,
  buildPlaceholderSeoBlocks,
  type RegionalSeoContext,
} from "@/lib/academy/regional-seo-vars";
import type { RegionalSeoBlock } from "@/lib/academy/regional-seo-content";
import { pickRegionalSeoContent } from "@/lib/academy/regional-seo-pick";

export function resolveBoundSeoSectionIntro(
  label: string,
  ctx: RegionalSeoContext
): string {
  if (ctx.hasRecommendedAcademy) {
    return `${label} 애견미용학원 안내와 함께, 인증 추천 학원 ${ctx.recommendedAcademyName} 정보를 참고해 보세요.`;
  }

  if (ctx.hasNearbyRecommendedAcademy) {
    return `${label}에는 아직 인증 추천 학원이 없습니다. 가까운 ${ctx.nearbyRecommendedRegion} 지역에 위치한 ${ctx.nearbyRecommendedAcademyName}을(를) 통학·상담 관점에서 참고해 보세요.`;
  }

  return `${label}에서 애견미용학원을 찾고 계신가요? 수강료·자격증·실습 환경 비교 가이드입니다.`;
}

export function resolveBoundNearbyIntro(
  page: RegionalLandingPage,
  ctx: RegionalSeoContext
): string | undefined {
  if (!page.nearbyIntro) return undefined;
  return bindRegionalSeoText(page.nearbyIntro, ctx);
}

export function resolveBoundRegionInfo(
  page: RegionalLandingPage,
  ctx: RegionalSeoContext
): string {
  const pick = pickRegionalSeoContent(page, ctx);
  const raw =
    pick.regionInfo ??
    `{region} 지역 애견미용학원 정보를 한곳에서 비교하세요.`;
  return bindRegionalSeoText(raw, ctx);
}

export function resolveBoundMetaDescription(
  page: RegionalLandingPage,
  ctx: RegionalSeoContext
): string {
  const pick = pickRegionalSeoContent(page, ctx);
  const raw =
    pick.metaDescription ??
    (ctx.hasRecommendedAcademy
      ? `{region} 애견미용학원 수강료·국비지원·실습 환경. 인증 추천 [{recommendedAcademyName}] 정보 포함.`
      : ctx.hasNearbyRecommendedAcademy
        ? `{region} 애견미용학원. 지역 내 인증 추천은 없으나 인근 {nearbyRecommendedRegion} [{nearbyRecommendedAcademyName}] 참고.`
        : `{region} 애견미용학원 수강료·국비지원·실습 환경 안내.`);
  return bindRegionalSeoText(raw, ctx).slice(0, 160);
}

export function resolveBoundSeoBlocks(
  page: RegionalLandingPage,
  ctx: RegionalSeoContext
): RegionalSeoBlock[] {
  const pick = pickRegionalSeoContent(page, ctx);
  const source =
    pick.seoBlocks?.length
      ? pick.seoBlocks
      : buildPlaceholderSeoBlocks();
  return bindRegionalSeoBlocks(source, ctx);
}

export function resolveBoundFaqItems(
  page: RegionalLandingPage,
  ctx: RegionalSeoContext
): Array<{ question: string; answer: string }> {
  const pick = pickRegionalSeoContent(page, ctx);

  if (pick.faqItems?.length) {
    return bindRegionalFaqItems(pick.faqItems, ctx);
  }

  return [
    {
      question: bindRegionalSeoText(
        `{region} 애견미용학원 수강료는 얼마인가요?`,
        ctx
      ),
      answer: bindRegionalSeoText(
        `{region} 지역 애견미용학원 수강료는 과정에 따라 150만~1,200만 원대입니다.`,
        ctx
      ),
    },
    {
      question: bindRegionalSeoText(
        ctx.hasRecommendedAcademy
          ? `{region} 인증 추천 학원 [{recommendedAcademyName}]은 어떤가요?`
          : ctx.hasNearbyRecommendedAcademy
            ? `{region}에 인증 추천 학원이 없다면 인근 [{nearbyRecommendedAcademyName}]은 어떤가요?`
            : `{region} 애견미용학원은 어떻게 고르나요?`,
        ctx
      ),
      answer: bindRegionalSeoText(
        ctx.hasRecommendedAcademy
          ? `{region}에서 인증 추천된 [{recommendedAcademyName}]은 {recommendedAcademyHighlight} 측면에서 참고할 만합니다.`
          : ctx.hasNearbyRecommendedAcademy
            ? `{region}에는 인증 추천 학원이 없습니다. 인근 {nearbyRecommendedRegion}에 위치한 [{nearbyRecommendedAcademyName}]은 {nearbyRecommendedAcademyHighlight} 측면에서 통학·상담 관점에서 참고할 만합니다.`
            : `{region} 지역 학원을 수강료·실습 환경·국비지원 여부로 비교해 보세요.`,
        ctx
      ),
    },
    {
      question: bindRegionalSeoText(
        `{region} 애견미용학원 실습 환경은 어떻게 확인하나요?`,
        ctx
      ),
      answer: bindRegionalSeoText(
        `상담·견학 시 실습견 배정·위생·휴식 관리를 직접 확인하세요.`,
        ctx
      ),
    },
    {
      question: "인증 추천 학원과 일반 등록 학원의 차이는?",
      answer:
        "인증 추천 학원은 검증된 정보로 상단에 우선 노출됩니다.",
    },
  ];
}
