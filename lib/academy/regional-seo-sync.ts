import "server-only";

import { generateRegionalLandingWithGemini } from "@/lib/ai/regional-landing-gemini";
import { getAdjacentLabels } from "@/lib/constants/region-adjacency";
import type { RegionalLandingPage } from "@/lib/types/regional-landing";
import type { RegionalSeoContext } from "@/lib/academy/regional-seo-vars";
import { upsertRegionalLanding } from "@/lib/academy/regional-store";

/** 저장된 SEO 본문이 없을 때만 Gemini로 1회 생성 (추천학원 변경은 렌더 시 변수 치환) */
export async function ensureRegionalSeoContent(
  page: RegionalLandingPage,
  ctx: RegionalSeoContext
): Promise<RegionalLandingPage> {
  if (page.seoBlocks?.length) return page;

  const nearbyLabels = getAdjacentLabels(page.label, 5);

  const gemini = await generateRegionalLandingWithGemini({
    label: page.label,
    keyword: page.keyword,
    regionBig: page.regionBig,
    nearbyLabels,
    recommendedAcademyName: ctx.recommendedAcademyName,
    recommendedAcademyHighlight: ctx.recommendedAcademyHighlight,
    hasRecommendedAcademy: ctx.hasRecommendedAcademy,
    hasNearbyRecommendedAcademy: ctx.hasNearbyRecommendedAcademy,
    nearbyRecommendedAcademyName: ctx.nearbyRecommendedAcademyName,
    nearbyRecommendedRegion: ctx.nearbyRecommendedRegion,
    academyImageUrl: ctx.ogImageUrl,
  });

  if (!gemini.ok) return page;

  const updated = {
    ...page,
    regionInfo: gemini.data.regionInfo,
    nearbyIntro: gemini.data.nearbyIntro,
    metaDescription: gemini.data.metaDescription,
    seoBlocks: gemini.data.seoBlocks,
    faqItems: gemini.data.faqItems,
  };

  const saved = await upsertRegionalLanding(updated);
  if ("error" in saved) return page;
  return saved.page;
}
