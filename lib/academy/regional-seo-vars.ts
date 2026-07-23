import type { Academy } from "@/lib/types/academy";
import type {
  RegionalFaqItemStored,
  RegionalSeoBlockStored,
} from "@/lib/types/regional-landing";
import type { RegionalSeoBlock } from "@/lib/academy/regional-seo-content";
import { getAcademyThumbnail } from "@/lib/academy/images";
import type { RegionalServiceConfig } from "@/lib/seo/regional-service-config";
import { getRegionalServiceConfig } from "@/lib/seo/regional-service-config";

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

const DEFAULT_HIGHLIGHT =
  "실습견 매칭·위생 관리·1:1 맞춤 피드백 등 교육 품질 기준";

function defaultEntityName(config: RegionalServiceConfig): string {
  return `인증 추천 ${config.entityLabel}`;
}

function defaultNearbyName(config: RegionalServiceConfig): string {
  return `인근 인증 추천 ${config.entityLabel}`;
}

function defaultLocalRecommendedLabel(config: RegionalServiceConfig): string {
  return `해당 지역 인증 추천 ${config.entityLabel}`;
}

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

/** 본문 변수 치환 — 지역 추천 없을 때 인근 업체명을 recommended 슬롯에 넣지 않음 */
export function resolveBindableAcademyNames(
  ctx: RegionalSeoContext,
  config: RegionalServiceConfig = getRegionalServiceConfig("academy")
): {
  recommended: string;
  nearby: string;
  highlight: string;
  nearbyHighlight: string;
} {
  const recommended = ctx.hasRecommendedAcademy
    ? ctx.recommendedAcademyName
    : defaultLocalRecommendedLabel(config);

  const nearby = ctx.nearbyRecommendedAcademyName || defaultNearbyName(config);

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
  nearbyRecommended: Academy | null = null,
  serviceConfig: RegionalServiceConfig = getRegionalServiceConfig("academy")
): RegionalSeoContext {
  const hasRecommendedAcademy = Boolean(recommended);
  const nearby = !hasRecommendedAcademy ? nearbyRecommended : null;
  const imageAcademy = pickRegionalSeoImageAcademy(recommended, nearby);

  return {
    region: regionLabel,
    recommendedAcademyName: recommended?.name ?? defaultEntityName(serviceConfig),
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
  ctx: RegionalSeoContext,
  serviceConfig?: RegionalServiceConfig
): string {
  const { recommended, nearby, highlight, nearbyHighlight } =
    resolveBindableAcademyNames(ctx, serviceConfig);

  let bound = text
    .replaceAll(REGION_VAR, ctx.region)
    .replaceAll(RECOMMENDED_ACADEMY_VAR, recommended)
    .replaceAll(RECOMMENDED_HIGHLIGHT_VAR, highlight)
    .replaceAll(NEARBY_REGION_VAR, ctx.nearbyRecommendedRegion || "인근 지역")
    .replaceAll(NEARBY_ACADEMY_VAR, nearby)
    .replaceAll(NEARBY_HIGHLIGHT_VAR, nearbyHighlight)
    .replaceAll(`[${RECOMMENDED_ACADEMY_VAR}]`, recommended)
    .replaceAll(`[${NEARBY_ACADEMY_VAR}]`, nearby)
    .replaceAll(`[인증 추천 애견미용학원]`, recommended)
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
  ctx: RegionalSeoContext,
  serviceConfig?: RegionalServiceConfig
): RegionalSeoBlock[] {
  return blocks.map((block) => ({
    title: bindRegionalSeoText(block.title, ctx, serviceConfig),
    paragraphs: block.paragraphs.map((p) =>
      bindRegionalSeoText(p, ctx, serviceConfig)
    ),
    bullets: block.bullets.map((b) => bindRegionalSeoText(b, ctx, serviceConfig)),
  }));
}

export function bindRegionalFaqItems(
  items: RegionalFaqItemStored[],
  ctx: RegionalSeoContext,
  serviceConfig?: RegionalServiceConfig
): RegionalFaqItemStored[] {
  return items.map((item) => ({
    question: bindRegionalSeoText(item.question, ctx, serviceConfig),
    answer: bindRegionalSeoText(item.answer, ctx, serviceConfig),
  }));
}

/** Gemini 미생성 시 카테고리별 SEO 템플릿 (소제목 3~4개) */
export function buildPlaceholderSeoBlocks(
  category: import("@/lib/seo/regional-service-config").RegionalServiceCategory = "academy"
): RegionalSeoBlockStored[] {
  const config = getRegionalServiceConfig(category);
  const title = config.title;
  const entity = config.entityLabel;

  if (category === "academy") {
    return [
      {
        title: `{region} ${title}, 어떤 기준으로 고를까요?`,
        paragraphs: [
          `{region}에서 애견미용 자격증·취업·창업을 준비한다면 수강료·국비지원·실습 환경·합격률을 함께 비교하는 것이 좋습니다.`,
        ],
        bullets: [
          `수강료·국비지원(내일배움카드) 적용 여부`,
          `실습견 배정·실습 환경`,
          `자격증 과정·취업 연계`,
        ],
      },
      {
        title: `{region} ${title} 수강료·국비지원 안내`,
        paragraphs: [
          `{region} ${title} 수강료는 과정·등급에 따라 차이가 큽니다. 방문 상담 시 국비지원 가능 여부를 확인하세요.`,
        ],
        bullets: [
          `입문·자격증·창업 과정별 비용 비교`,
          `분할 납부·재수강 할인 여부`,
          `교재·도구 포함 범위 확인`,
        ],
      },
      {
        title: `{region} 인증 추천 ${title}`,
        paragraphs: [
          `{region} 지역에서 인증 추천으로 등록된 [{recommendedAcademyName}]은 {recommendedAcademyHighlight} 측면에서 참고할 만합니다.`,
          `인근 {nearbyRecommendedRegion}의 [{nearbyRecommendedAcademyName}] 정보도 함께 비교해 보세요.`,
        ],
        bullets: [
          `인증 추천 ${entity} 상단에서 상세 확인`,
          `{region} ${title} 키워드 맞춤 정보`,
          `방문 상담·견학 권장`,
        ],
      },
      {
        title: `{region} ${title} 실습·자격증 체크리스트`,
        paragraphs: [
          `{region} ${title}을 선택할 때는 실습견 배정·위생·휴식 관리를 직접 확인하는 것이 중요합니다.`,
        ],
        bullets: [
          `실습견 수·배정 방식`,
          `자격증 시험 대비 커리큘럼`,
          `졸업 후 취업·창업 지원`,
        ],
      },
    ];
  }

  if (category === "shelter") {
    return [
      {
        title: `{region} 강아지파양 상담 전 꼭 확인할 점`,
        paragraphs: [
          `{region}에서 강아지파양을 고민한다면 유기보다 먼저 보호소 상담을 통해 아이에게 새로운 가족을 찾아주는 방향을 검토하는 것이 좋습니다.`,
          `군입대, 이민, 보호자 건강 악화, 가족 돌봄 공백처럼 더 이상 함께할 수 없는 상황이라면 아이 상태와 생활 이력을 정리해 상담을 시작하세요.`,
        ],
        bullets: [
          `기본 접종·중성화 기록`,
          `성격·사회화 정도`,
          `방문 가능 요일·시간`,
        ],
      },
      {
        title: `강아지무료분양 안내`,
        paragraphs: [
          `강아지무료분양은 유기견·유기묘를 뜻하는 것이 아니라, 가정에서 생활하던 아이가 사정으로 인해 새로운 가족을 찾는 경우를 의미하는 경우가 많습니다.`,
          `아이 성향과 건강 상태를 솔직하게 공유할수록 더 잘 맞는 가정을 찾는 데 도움이 됩니다.`,
        ],
        bullets: [
          `아이의 생활 습관과 식이`,
          `분리불안·사회성 여부`,
          `새 가족에게 꼭 알려야 할 특이사항`,
        ],
      },
      {
        title: `사설보호소 비용 안내를 볼 때 주의할 점`,
        paragraphs: [
          `사설보호소는 어떤 곳이든 아이들의 보호·의료·케어를 위한 입소비용이 발생할 수 있습니다.`,
          `다만 너무 말도 안 되게 높은 금액이거나 지나치게 낮은 금액이라면 한 번쯤 의심해 보고, 무엇이 포함된 비용인지 항목별로 확인하는 것이 안전합니다.`,
        ],
        bullets: [
          `입소비용 포함 항목`,
          `의료·사료·위탁 범위`,
          `사후 상담과 진행 방식`,
        ],
      },
      {
        title: `믿을 수 있는 보호소를 고르는 기준`,
        paragraphs: [
          `뉴스로 보도된 사례처럼 믿기 어려운 운영을 하는 곳도 있을 수 있으니, 보호 환경과 비용 구조를 투명하게 설명하는지 꼭 살펴보세요.`,
          `{region} 인근 시설마다 보호 공간·산책·급여·입양 연결 방식이 다르므로 방문 또는 상담 단계에서 가독성 있게 정리된 설명을 제공하는 곳인지 확인하는 것도 중요합니다.`,
        ],
        bullets: [
          `운영 방식 설명의 투명성`,
          `보호 환경·위생 상태`,
          `상담 응대와 연락 신뢰도`,
        ],
      },
    ];
  }

  return [
    {
      title: `{region} ${title} 안내`,
      paragraphs: [
        `{region} ${title} 정보를 찾는 분을 위해 핵심 안내를 정리했습니다.`,
      ],
      bullets: [`상담 가능 시간`, `위치·주차`, `준비 서류`],
    },
    {
      title: `{region}에서 확인하면 좋은 점`,
      paragraphs: [
        `${title}마다 서비스 범위가 달라 비교가 필요합니다.`,
      ],
      bullets: [`서비스 범위`, `비용 안내`, `후기·인증`],
    },
    {
      title: `이용 전 체크리스트`,
      paragraphs: [
        `원하는 일정·예산·연락 방법을 구체적으로 전달하면 상담이 수월합니다.`,
      ],
      bullets: [`원하는 일정`, `예산 범위`, `연락 방법`],
    },
  ];
}
