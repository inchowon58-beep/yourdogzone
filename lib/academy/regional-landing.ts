import type { Metadata } from "next";
import type { RegionalLandingPage } from "@/lib/types/regional-landing";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  getAllRegionalLandings,
  getRegionalLandingBySlug,
  getPublishedRegionalSlugs,
} from "@/lib/academy/regional-store";

export type { RegionalLandingPage } from "@/lib/types/regional-landing";

export {
  getAllRegionalLandings,
  getRegionalLandingBySlug,
  getPublishedRegionalSlugs,
  resolveNearbyPages,
  upsertRegionalLanding,
  deleteRegionalLanding,
} from "@/lib/academy/regional-store";

export { generateRegionalLandingFromKeyword } from "@/lib/academy/regional-generator";

export async function resolveRegionalLanding(
  slug: string
): Promise<RegionalLandingPage | null> {
  return getRegionalLandingBySlug(slug);
}

export function regionalLandingPath(page: RegionalLandingPage): string {
  return `/services/academy/region/${page.slug}`;
}

export function buildRegionalLandingKeywords(label: string): string[] {
  return [
    `${label} 애견미용학원`,
    `${label} 애견미용`,
    `${label} 반려견 미용학원`,
    `${label} 애견미용 자격증`,
    `${label} 애견미용학원 추천`,
    `${label} 애견미용학원 수강료`,
    `${label} 애견미용 국비지원`,
    `${label} 강아지 미용학원`,
    "애견미용학원",
    "애견미용 자격증",
    "반려견 미용 교육",
  ];
}

export function buildRegionalLandingMetadata(page: RegionalLandingPage): Metadata {
  const { label } = page;
  const path = regionalLandingPath(page);

  return buildPageMetadata({
    title: `${label} 애견미용학원 추천 · ${label} 지역 미용학원 정보`,
    description:
      page.regionInfo?.slice(0, 155) ??
      `${label}에서 애견미용 자격증을 준비한다면? ${label} 지역 애견미용학원의 수강료·국비지원·실습 환경·인증 추천 학원을 한곳에서 비교하세요.`,
    path,
    keywords: buildRegionalLandingKeywords(label),
  });
}

export type RegionalSeoBlock = {
  title: string;
  paragraphs: string[];
  bullets: string[];
};

export function buildRegionalSeoContent(
  page: RegionalLandingPage
): RegionalSeoBlock[] {
  const { label, regionInfo } = page;
  return [
    {
      title: `${label} 애견미용학원, 왜 지역별로 비교해야 할까요?`,
      paragraphs: [
        regionInfo ??
          `${label} 지역 애견미용학원은 통학 거리·실습견 배정·국비지원 과정 개강 일정·취업 연계 네트워크가 제각각입니다.`,
        `유아독존은 ${label} 애견미용학원 정보를 지역별로 정리해, 인증 추천 학원과 일반 등록 학원을 구분해 보여 드립니다.`,
      ],
      bullets: [
        `${label} 인근 통학·주차·대중교통 접근성`,
        `국비지원(내일배움카드) ${label} 개강 과정 여부`,
        `실습견 배정·위그/생체 실습 비율`,
        `한국애견연맹·한국애견협회 등 자격증 연계`,
      ],
    },
    {
      title: `${label} 애견미용학원 선택 시 체크리스트`,
      paragraphs: [
        `${label}에서 애견미용학원을 알아볼 때는 직접 방문해 실습실·위생·강사진을 확인하는 것이 좋습니다.`,
        `아래 가이드에서 수강료·국비지원, 자격증 기간, 실습견 환경을 확인한 뒤 하단 ${label} 애견미용학원 목록에서 상세 페이지로 이동하세요.`,
      ],
      bullets: [
        `수강료 외 도구·시험·협회 가입 등 추가 비용`,
        `평일반·주말반·야간반 등 일정`,
        `취업·창업 연계 사례`,
        `환불·중도 포기 규정`,
      ],
    },
  ];
}

export function buildRegionalGuideFaqItems(label: string): Array<{
  question: string;
  answer: string;
}> {
  return [
    {
      question: `${label} 애견미용학원 수강료는 얼마인가요?`,
      answer: `${label} 지역 애견미용학원 수강료는 과정에 따라 보통 150만 원~1,200만 원대입니다. 국비지원 과정이면 자부담이 줄어들 수 있습니다.`,
    },
    {
      question: `${label}에서 애견미용 자격증까지 얼마나 걸리나요?`,
      answer: `3급 기초는 3~6개월, 2급 실무는 6개월~1년이 일반적입니다. ${label} 애견미용학원마다 주말반·평일반에 따라 기간이 달라집니다.`,
    },
    {
      question: `${label} 애견미용학원 실습견은 어떻게 확인하나요?`,
      answer: `상담·견학 시 1인당 일일 실습견 배정, 품종 다양성, 위생·휴식 관리를 직접 확인하세요.`,
    },
    {
      question: `인증 추천 학원과 일반 등록 학원의 차이는?`,
      answer: `인증 추천 학원은 기본 정보가 검증된 학원으로 상단에 우선 노출됩니다. 일반 등록 학원은 하단 목록에 표시됩니다.`,
    },
  ];
}
