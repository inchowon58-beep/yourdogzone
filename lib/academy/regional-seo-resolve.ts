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
      return `${label}에서 강아지파양(입소)·무료분양을 알아볼 때, 비용·보호 환경·절차를 확인하고 신뢰할 수 있는 상담부터 시작하세요.`;
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
      return `{region}에서 강아지파양·무료분양을 고민한다면 유기 대신 사설보호소 상담으로 아이에게 새 가족을 찾아주는 방법을 먼저 확인하세요.`;
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
          answer: `아이 상태·나이·중성화·접종 이력을 정리한 뒤 {region} 인근 사설보호소에 전화·온라인으로 문의하면 입소·보호 가능 여부를 안내받을 수 있습니다.`,
        },
        {
          question: `강아지무료분양은 유기견·유기묘를 말하나요?`,
          answer: `아닙니다. 가정에서 생활하던 아이들이 사정으로 파양되어 새로운 가족을 찾는 경우를 뜻하는 경우가 많습니다.`,
        },
        {
          question: `사설보호소는 왜 입소비용이 발생하나요?`,
          answer: `사설보호소는 보호·의료·케어 운영비가 들어가므로 입소 시 비용이 발생합니다. 모든 사설보호소가 해당될 수 있으며, 너무 비싸거나 지나치게 저렴하면 항목과 보호 환경을 한 번 더 확인하세요.`,
        },
        {
          question: `시 유기견보호소에도 개인 사정으로 파양할 수 있나요?`,
          answer: `시·군 유기견보호소는 개인 사정의 파양보다 실제 유기·미아 동물을 보호하는 경우가 많고, 일정 기간 후 안락사가 이뤄질 수 있습니다. 주인이 있는 아이의 파양은 사실상 어렵다고 보는 편이 맞습니다.`,
        },
        {
          question: `어쩔 수 없는 파양은 나쁜 일인가요?`,
          answer: `군입대·이민·임신·보호자 신변 이상처럼 함께하기 어려운 상황에서의 파양은, 유기하지 않고 새 가정을 찾아주는 바람직한 선택일 수 있습니다.`,
        },
        {
          question: `강아지파양 절차는 어떻게 되나요?`,
          answer: `상담 → 아이 상태 체크 → 보호소 입소 → 새로운 가족 찾기의 흐름이 일반적입니다. 급하게 결정하기보다 비용·환경을 확인한 뒤 진행하세요.`,
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
