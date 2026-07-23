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
import {
  getRegionalServiceConfig,
  resolvePageCategory,
  type RegionalServiceCategory,
} from "@/lib/seo/regional-service-config";

function categoryOf(page?: RegionalLandingPage): RegionalServiceCategory {
  return page ? resolvePageCategory(page) : "academy";
}

export function resolveBoundSeoSectionIntro(
  label: string,
  ctx: RegionalSeoContext,
  category: RegionalServiceCategory = "academy"
): string {
  if (ctx.hasRecommendedAcademy) {
    const title = getRegionalServiceConfig(category).title;
    return `${label} ${title} 정보와 인증 추천 ${ctx.recommendedAcademyName} 안내입니다.`;
  }

  switch (category) {
    case "shelter":
      return `${label}에서 강아지파양과 무료분양을 고민하는 분이 꼭 알아두면 좋은 기본 안내입니다.`;
    case "adoption":
      return `${label}에서 강아지분양·입양 전 확인하면 좋은 비교 가이드입니다.`;
    case "funeral":
      return `${label}에서 강아지장례 이용 전 절차·비용·예약 시 알아두면 좋은 안내입니다.`;
    case "breeder":
      return `${label}에서 브리더 선택 전 확인하면 좋은 비교 가이드입니다.`;
    case "hospital":
      return `${label}에서 동물병원 진료·예약 전 확인하면 좋은 안내입니다.`;
    case "academy":
    default:
      return `${label} 애견미용학원 수강료·자격증·실습 환경 비교 가이드입니다.`;
  }
}

function fallbackRegionInfo(category: RegionalServiceCategory): string {
  const title = getRegionalServiceConfig(category).title;
  switch (category) {
    case "shelter":
      return `{region}에서 강아지파양이나 무료분양을 고민할 때 유기 대신 안전하게 상담할 수 있는 보호소·입소 절차 정보를 확인하세요.`;
    case "adoption":
      return `{region} ${title} 업체 정보를 한곳에서 비교하세요.`;
    case "funeral":
      return `{region} ${title} 이용 정보를 한곳에서 확인하세요.`;
    case "breeder":
      return `{region} ${title} 정보를 한곳에서 비교하세요.`;
    case "hospital":
      return `{region} ${title} 정보를 한곳에서 확인하세요.`;
    default:
      return `{region} ${title} 정보를 한곳에서 비교하세요.`;
  }
}

function fallbackMetaDescription(category: RegionalServiceCategory): string {
  const title = getRegionalServiceConfig(category).title;
  switch (category) {
    case "shelter":
      return `{region} 강아지파양·무료분양 상담 전 확인할 보호소 이용 안내와 주의사항.`;
    case "adoption":
      return `{region} ${title} 분양·입양 전 확인 포인트 안내.`;
    case "funeral":
      return `{region} ${title} 절차·비용·예약 안내.`;
    case "breeder":
      return `{region} ${title} 선택 전 확인 포인트 안내.`;
    case "hospital":
      return `{region} ${title} 진료·예약 안내.`;
    default:
      return `{region} ${title} 수강료·국비지원·실습 환경. 인증 추천 학원 정보 포함.`;
  }
}

function fallbackFaqItems(category: RegionalServiceCategory) {
  const config = getRegionalServiceConfig(category);
  const title = config.title;
  const entity = config.entityLabel;

  switch (category) {
    case "shelter":
      return [
        {
          question: `{region} 강아지파양 상담은 어떻게 시작하나요?`,
          answer: `아이 상태·나이·중성화 여부·접종 이력을 정리한 뒤 {region} 인근 보호소에 전화·온라인으로 문의하면 입소·보호 가능 여부를 안내받을 수 있습니다.`,
        },
        {
          question: `강아지무료분양은 유기견과 같은 의미인가요?`,
          answer: `아닙니다. 이 페이지에서 말하는 강아지무료분양은 가정에서 생활하던 아이가 부득이한 사정으로 새로운 가족을 찾는 경우를 뜻합니다.`,
        },
        {
          question: `사설보호소 입소비용은 왜 확인해야 하나요?`,
          answer: `사설보호소는 아이 보호·의료·케어를 위한 입소비용이 발생할 수 있습니다. 너무 과도하게 높거나 지나치게 낮다면 한 번 더 확인하고, 비용 항목을 투명하게 설명하는 곳인지 살펴보는 것이 좋습니다.`,
        },
        {
          question: `어떤 상황에서 강아지파양 보호소 상담이 필요할까요?`,
          answer: `군입대, 이민, 보호자 신변 이상처럼 더 이상 함께 생활하기 어려운 경우라면 유기 대신 보호소 상담을 통해 아이에게 새로운 가족을 찾는 방향을 우선 고려하는 것이 좋습니다.`,
        },
      ];
    case "adoption":
      return [
        {
          question: `{region} ${title}은 어떻게 고르나요?`,
          answer: `분양 조건·건강 검진·사후 케어·방문 가능 여부를 비교한 뒤 상담을 권합니다.`,
        },
        {
          question: `예약이 필요한가요?`,
          answer: `업체마다 다르니 방문 전 예약·상담 가능 시간을 확인해 주세요.`,
        },
        {
          question: `인증 추천 ${entity}과 일반 등록의 차이는?`,
          answer: `인증 추천은 검증된 정보로 상단에 우선 노출됩니다.`,
        },
      ];
    case "funeral":
      return [
        {
          question: `{region} ${title} 이용 절차는?`,
          answer: `상담 후 일정·방식(화장 등)·비용을 확인하고 예약하는 흐름이 일반적입니다.`,
        },
        {
          question: `비용은 어떻게 확인하나요?`,
          answer: `서비스 범위에 따라 달라 상담 시 항목별 안내를 받는 것이 좋습니다.`,
        },
        {
          question: `인증 추천 ${entity}과 일반 등록의 차이는?`,
          answer: `인증 추천은 검증된 정보로 상단에 우선 노출됩니다.`,
        },
      ];
    case "breeder":
    case "hospital":
      return [
        {
          question: `{region} ${title}은 어떻게 고르나요?`,
          answer: `위치·운영 시간·서비스 범위·후기를 비교하고 상담을 권합니다.`,
        },
        {
          question: `예약이 필요한가요?`,
          answer: `시설에 따라 다르니 방문 전 예약 여부를 확인해 주세요.`,
        },
        {
          question: `인증 추천 ${entity}과 일반 등록의 차이는?`,
          answer: `인증 추천은 검증된 정보로 상단에 우선 노출됩니다.`,
        },
      ];
    default:
      return [
        {
          question: `{region} ${title} 수강료는 얼마인가요?`,
          answer: `{region} 지역 ${title} 수강료는 과정에 따라 150만~1,200만 원대입니다.`,
        },
        {
          question: `{region} ${title}은 어떻게 고르나요?`,
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
      ];
  }
}

export function resolveBoundRegionInfo(
  page: RegionalLandingPage,
  ctx: RegionalSeoContext
): string {
  const category = categoryOf(page);
  const config = getRegionalServiceConfig(category);
  const pick = pickRegionalSeoContent(page);
  const raw = pick.regionInfo ?? fallbackRegionInfo(category);
  return bindRegionalSeoText(raw, ctx, config);
}

export function resolveBoundMetaDescription(
  page: RegionalLandingPage,
  ctx: RegionalSeoContext
): string {
  const category = categoryOf(page);
  const config = getRegionalServiceConfig(category);
  const pick = pickRegionalSeoContent(page);
  const raw = pick.metaDescription ?? fallbackMetaDescription(category);
  return bindRegionalSeoText(raw, ctx, config).slice(0, 160);
}

export function resolveBoundSeoBlocks(
  page: RegionalLandingPage,
  ctx: RegionalSeoContext
): RegionalSeoBlock[] {
  const category = categoryOf(page);
  const config = getRegionalServiceConfig(category);
  const pick = pickRegionalSeoContent(page);
  const source = pick.seoBlocks?.length
    ? pick.seoBlocks
    : buildPlaceholderSeoBlocks(category);
  return bindRegionalSeoBlocks(source, ctx, config);
}

export function resolveBoundFaqItems(
  page: RegionalLandingPage,
  ctx: RegionalSeoContext
): Array<{ question: string; answer: string }> {
  const category = categoryOf(page);
  const config = getRegionalServiceConfig(category);
  const pick = pickRegionalSeoContent(page);

  if (pick.faqItems?.length) {
    return bindRegionalFaqItems(pick.faqItems, ctx, config);
  }

  return bindRegionalFaqItems(fallbackFaqItems(category), ctx, config);
}
