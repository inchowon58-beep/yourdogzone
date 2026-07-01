import type { Academy } from "@/lib/types/academy";
import type {
  RegionalFaqItemStored,
  RegionalSeoBlockStored,
} from "@/lib/types/regional-landing";
import type { RegionalSeoBlock } from "@/lib/academy/regional-seo-content";
import { getAcademyThumbnail } from "@/lib/academy/images";

/** Gemini·템플릿에 그대로 넣는 플레이스홀더 (렌더 시 실시간 치환) */
export const REGION_VAR = "{region}";
export const RECOMMENDED_ACADEMY_VAR = "{recommendedAcademyName}";
export const RECOMMENDED_HIGHLIGHT_VAR = "{recommendedAcademyHighlight}";
export const NEARBY_REGION_VAR = "{nearbyRecommendedRegion}";
export const NEARBY_ACADEMY_VAR = "{nearbyRecommendedAcademyName}";
export const NEARBY_HIGHLIGHT_VAR = "{nearbyRecommendedAcademyHighlight}";

export type RegionalSeoContext = {
  region: string;
  recommendedAcademyName: string;
  recommendedAcademyHighlight: string;
  recommendedAcademySlug?: string;
  hasRecommendedAcademy: boolean;
  nearbyRecommendedAcademyName: string;
  nearbyRecommendedRegion: string;
  nearbyRecommendedAcademyHighlight: string;
  hasNearbyRecommendedAcademy: boolean;
  /** OG·SEO 섹션용 대표 이미지 (추천학원 → 없으면 인근 추천학원) */
  ogImageUrl: string | null;
};

const DEFAULT_ACADEMY_NAME = "인증 추천 애견미용학원";
const DEFAULT_HIGHLIGHT =
  "실습견 매칭·위생 관리·1:1 맞춤 피드백 등 교육 품질 기준";

const DEFAULT_NEARBY_NAME = "인근 인증 추천 애견미용학원";

export function pickRecommendedAcademy(
  premiumAcademies: Academy[]
): Academy | null {
  if (premiumAcademies.length === 0) return null;
  const sorted = [...premiumAcademies].sort((a, b) =>
    a.slug.localeCompare(b.slug)
  );
  return sorted[0];
}

function academyHighlight(academy: Academy | null): string {
  if (!academy) return DEFAULT_HIGHLIGHT;
  return (
    academy.title_copy?.trim().slice(0, 100) ||
    academy.curriculum?.trim().slice(0, 100) ||
    DEFAULT_HIGHLIGHT
  );
}

const DEFAULT_LOCAL_RECOMMENDED_LABEL = "해당 지역 인증 추천 애견미용학원";

/** 본문 변수 치환 — 지역 추천 없을 때 인근 학원명을 recommended 슬롯에 넣지 않음 */
export function resolveBindableAcademyNames(ctx: RegionalSeoContext): {
  recommended: string;
  nearby: string;
  highlight: string;
  nearbyHighlight: string;
} {
  const recommended = ctx.hasRecommendedAcademy
    ? ctx.recommendedAcademyName
    : DEFAULT_LOCAL_RECOMMENDED_LABEL;

  const nearby = ctx.nearbyRecommendedAcademyName || DEFAULT_NEARBY_NAME;

  const highlight = ctx.hasRecommendedAcademy
    ? ctx.recommendedAcademyHighlight
    : DEFAULT_HIGHLIGHT;

  const nearbyHighlight = ctx.hasNearbyRecommendedAcademy
    ? ctx.nearbyRecommendedAcademyHighlight
    : DEFAULT_HIGHLIGHT;

  return { recommended, nearby, highlight, nearbyHighlight };
}

export function pickRegionalSeoImageAcademy(
  recommended: Academy | null,
  nearbyRecommended: Academy | null
): Academy | null {
  return recommended ?? nearbyRecommended;
}

export function buildRegionalSeoContext(
  regionLabel: string,
  recommended: Academy | null,
  nearbyRecommended: Academy | null = null
): RegionalSeoContext {
  const hasRecommendedAcademy = Boolean(recommended);
  const nearby = !hasRecommendedAcademy ? nearbyRecommended : null;
  const imageAcademy = pickRegionalSeoImageAcademy(recommended, nearby);

  return {
    region: regionLabel,
    recommendedAcademyName: recommended?.name ?? DEFAULT_ACADEMY_NAME,
    recommendedAcademyHighlight: academyHighlight(recommended),
    recommendedAcademySlug: recommended?.slug,
    hasRecommendedAcademy,
    nearbyRecommendedAcademyName: nearby?.name ?? "",
    nearbyRecommendedRegion: nearby?.region_small ?? "",
    nearbyRecommendedAcademyHighlight: academyHighlight(nearby),
    hasNearbyRecommendedAcademy: Boolean(nearby),
    ogImageUrl: imageAcademy ? getAcademyThumbnail(imageAcademy) : null,
  };
}

export function bindRegionalSeoText(
  text: string,
  ctx: RegionalSeoContext
): string {
  const { recommended, nearby, highlight, nearbyHighlight } =
    resolveBindableAcademyNames(ctx);

  let bound = text
    .replaceAll(REGION_VAR, ctx.region)
    .replaceAll(RECOMMENDED_ACADEMY_VAR, recommended)
    .replaceAll(RECOMMENDED_HIGHLIGHT_VAR, highlight)
    .replaceAll(NEARBY_REGION_VAR, ctx.nearbyRecommendedRegion || "인근 지역")
    .replaceAll(NEARBY_ACADEMY_VAR, nearby)
    .replaceAll(NEARBY_HIGHLIGHT_VAR, nearbyHighlight)
    .replaceAll(`[${RECOMMENDED_ACADEMY_VAR}]`, recommended)
    .replaceAll(`[${NEARBY_ACADEMY_VAR}]`, nearby)
    .replaceAll(`[${DEFAULT_ACADEMY_NAME}]`, recommended)
    .replace(/\[\{recommendedAcademyName\}\]/g, recommended)
    .replace(/\[\{nearbyRecommendedAcademyName\}\]/g, nearby)
    .replace(/\[\{nearbyAcademyName\}\]/g, nearby);

  if (!ctx.hasRecommendedAcademy) {
    bound = bound
      .replace(
        new RegExp(
          `${ctx.region.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*지역에서\\s*특별히\\s*인증\\s*추천하는[^.]*\\.?`,
          "g"
        ),
        ""
      )
      .replace(
        /수많은\s*학원\s*중에서도\s*\{region\}[^.]*\[.*?\][^.]*\.?/g,
        ""
      );
  }

  if (!ctx.hasNearbyRecommendedAcademy) {
    bound = bound
      .replace(
        /인근\s*(?:지역\s*)?[\[{]?[^}\]]*[\]}]?\s*(?:의\s*)?경우도\s*참고하면\s*좋을\s*것\s*같습니다\.?/g,
        ""
      )
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  return bound;
}

export function bindRegionalSeoBlocks(
  blocks: RegionalSeoBlockStored[],
  ctx: RegionalSeoContext
): RegionalSeoBlock[] {
  return blocks.map((block) => ({
    title: bindRegionalSeoText(block.title, ctx),
    paragraphs: block.paragraphs.map((p) => bindRegionalSeoText(p, ctx)),
    bullets: block.bullets.map((b) => bindRegionalSeoText(b, ctx)),
  }));
}

export function bindRegionalFaqItems(
  items: RegionalFaqItemStored[],
  ctx: RegionalSeoContext
): RegionalFaqItemStored[] {
  return items.map((item) => ({
    question: bindRegionalSeoText(item.question, ctx),
    answer: bindRegionalSeoText(item.answer, ctx),
  }));
}

/** Gemini 미생성 시 사용하는 플레이스홀더 기본 템플릿 */
export function buildPlaceholderSeoBlocks(): RegionalSeoBlockStored[] {
  return [
    {
      title: `{region} 애견미용학원, 어떤 기준으로 고를까요?`,
      paragraphs: [
        `{region}에서 애견미용 자격증·취업·창업을 준비한다면 수강료·국비지원 여부·실습 환경·합격률을 함께 비교하는 것이 좋습니다.`,
        `유아독존은 {region} 지역 학원 정보를 검증·정리해 예비 수강생과 학원 원장님 모두에게 신뢰할 수 있는 큐레이션을 제공합니다.`,
      ],
      bullets: [
        `수강료·국비지원(내일배움카드) 적용 여부`,
        `실습견 배정·no-cage 등 실습 환경`,
        `자격증 과정·합격 후 취업 연계`,
        `방문 상담 시 확인할 체크리스트`,
      ],
    },
    {
      title: `{region} 지역 인증 추천 학원 안내`,
      paragraphs: [
        `수많은 학원 중에서도 {region} 지역에서 특별히 인증 추천하는 [{recommendedAcademyName}]의 경우, 수강생들이 가장 중요하게 생각하는 {recommendedAcademyHighlight} 등의 기준을 높은 수준으로 충족하고 있어 신뢰할 만합니다.`,
        `{region}에 아직 인증 추천 학원이 없다면, 인근 {nearbyRecommendedRegion} 지역 [{nearbyRecommendedAcademyName}]의 경우도 통학·상담 관점에서 참고하면 좋을 것 같습니다.`,
        `학원 운영자라면 공정한 검증 기준으로 지역 내 우수 학원이 돋보이게 소개되는 유아독존 큐레이션 시스템을 통해 브랜드 신뢰도를 높일 수 있습니다.`,
      ],
      bullets: [
        `인증 추천 학원은 상단에서 상세 정보 확인`,
        `인근 지역 인증 추천 학원도 함께 비교`,
        `{region} 애견미용학원 키워드 맞춤 정보 제공`,
      ],
    },
  ];
}

/** B안: 해당 지역 인증추천 없음 · 인근 학원 안내 (Gemini 미생성 시 폴백) */
export function buildPlaceholderSeoBlocksNearby(): RegionalSeoBlockStored[] {
  return [
    {
      title: `{region} 애견미용학원, 지역 내·인근 어디를 볼까요?`,
      paragraphs: [
        `{region}에서 애견미용 자격증·취업을 준비한다면 통학 거리와 실습 환경을 기준으로 학원을 비교하는 것이 좋습니다.`,
        `{region}에는 아직 유아독존 인증 추천 학원이 등록되어 있지 않습니다. 아래는 통학·상담 관점에서 참고할 수 있는 인근 지역 정보입니다.`,
      ],
      bullets: [
        `{region} 지역 일반 등록 학원 목록 확인`,
        `인근 {nearbyRecommendedRegion} 지역 통학 가능 여부`,
        `국비지원·실습견 환경 상담 시 직접 확인`,
        `인증 추천 학원과 일반 등록 학원 비교`,
      ],
    },
    {
      title: `{region}에는 없지만, 가까운 {nearbyRecommendedRegion} 인증 추천 학원`,
      paragraphs: [
        `{region} 지역에는 현재 인증 추천으로 등록된 애견미용학원이 없습니다.`,
        `다만 인근 {nearbyRecommendedRegion}에 위치한 [{nearbyRecommendedAcademyName}]은 {nearbyRecommendedAcademyHighlight} 측면에서 통학·상담이 가능한 대안으로 참고할 만합니다.`,
        `학원은 {region}에 있지 않으므로 방문 전 위치·통학 시간을 꼭 확인하세요.`,
      ],
      bullets: [
        `{region} → {nearbyRecommendedRegion} 통학·교통편 비교`,
        `[{nearbyRecommendedAcademyName}] 상세 페이지에서 수강료·과정 확인`,
        `지역 내 일반 등록 학원과 함께 비교`,
        `방문 상담 시 실습 환경 직접 확인`,
      ],
    },
  ];
}
