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
    return `${label} 애견미용학원 정보와 인증 추천 ${ctx.recommendedAcademyName} 안내입니다.`;
  }
  return `${label} 애견미용학원 수강료·자격증·실습 환경 비교 가이드입니다.`;
}

export function resolveBoundRegionInfo(
  page: RegionalLandingPage,
  ctx: RegionalSeoContext
): string {
  const pick = pickRegionalSeoContent(page);
  const raw =
    pick.regionInfo ??
    `{region} 애견미용학원 정보를 한곳에서 비교하세요.`;
  return bindRegionalSeoText(raw, ctx);
}

export function resolveBoundMetaDescription(
  page: RegionalLandingPage,
  ctx: RegionalSeoContext
): string {
  const pick = pickRegionalSeoContent(page);
  const raw =
    pick.metaDescription ??
    `{region} 애견미용학원 수강료·국비지원·실습 환경. 인증 추천 학원 정보 포함.`;
  return bindRegionalSeoText(raw, ctx).slice(0, 160);
}

export function resolveBoundSeoBlocks(
  page: RegionalLandingPage,
  ctx: RegionalSeoContext
): RegionalSeoBlock[] {
  const pick = pickRegionalSeoContent(page);
  const source =
    pick.seoBlocks?.length ? pick.seoBlocks : buildPlaceholderSeoBlocks();
  return bindRegionalSeoBlocks(source, ctx);
}

export function resolveBoundFaqItems(
  page: RegionalLandingPage,
  ctx: RegionalSeoContext
): Array<{ question: string; answer: string }> {
  const pick = pickRegionalSeoContent(page);

  if (pick.faqItems?.length) {
    return bindRegionalFaqItems(pick.faqItems, ctx);
  }

  return bindRegionalFaqItems(
    [
      {
        question: `{region} 애견미용학원 수강료는 얼마인가요?`,
        answer: `{region} 지역 애견미용학원 수강료는 과정에 따라 150만~1,200만 원대입니다.`,
      },
      {
        question: `{region} 애견미용학원은 어떻게 고르나요?`,
        answer: `수강료·국비지원·실습견 환경·자격증 과정을 비교하고 방문 상담을 권합니다.`,
      },
      {
        question: `{region} 애견미용 국비지원이 가능한가요?`,
        answer: `내일배움카드 등 국비지원 적용 여부는 학원·과정마다 다르므로 상담 시 확인하세요.`,
      },
      {
        question: "인증 추천 학원과 일반 등록 학원의 차이는?",
        answer:
          "인증 추천 학원은 검증된 정보로 상단에 우선 노출됩니다.",
      },
    ],
    ctx
  );
}
