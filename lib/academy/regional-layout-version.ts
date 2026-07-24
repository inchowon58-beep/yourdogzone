import type { RegionalLandingPage } from "@/lib/types/regional-landing";
import { resolvePageCategory } from "@/lib/seo/regional-service-config";

/** 보호소 SEO 레이아웃 버전 */
export type RegionalLayoutVersion = "v1" | "v2";

/** 로컬 SEO 템플릿(신뢰 가이드) 흔적 — layoutVersion 없이 올라간 어제 발행분 복구용 */
function looksLikeOfflineShelterSeo(
  page: Pick<RegionalLandingPage, "faqItems" | "seoBlocks" | "publishSource">
): boolean {
  if (page.publishSource === "offline-seo") return true;

  const faqText = (page.faqItems ?? [])
    .map((f) => `${f.question} ${f.answer}`)
    .join(" ");
  if (
    /강아지무료분양은 유기견|입소비용이 너무|시 유기견보호소에도 개인|어쩔 수 없는 파양은 나쁜|강아지파양 절차는 어떻게/.test(
      faqText
    )
  ) {
    return true;
  }

  const blockText = (page.seoBlocks ?? [])
    .map((b) => `${b.title} ${(b.paragraphs ?? []).join(" ")}`)
    .join(" ");
  if (
    /이런 상황이라면 상담하세요|사설보호소 입소비용 · 꼭 유의|강아지무료분양 · 유기견이 아닙니다|시 유기견보호소와 다른 점/.test(
      blockText
    )
  ) {
    return true;
  }

  return false;
}

/**
 * v1 — 기존 RegionalAcademySeoSection (seoBlocks 본문) · 웹 발행·구 페이지
 * v2 — ShelterRegionalTrustGuide · 로컬 SEO 발행
 * 필드 없음: 로컬 SEO 템플릿 흔적 있으면 v2, 아니면 v1
 */
export function resolveRegionalLayoutVersion(
  page: Pick<
    RegionalLandingPage,
    "layoutVersion" | "faqItems" | "seoBlocks" | "publishSource"
  >
): RegionalLayoutVersion {
  if (page.layoutVersion === "v2") return "v2";
  if (page.layoutVersion === "v1") return "v1";
  if (looksLikeOfflineShelterSeo(page)) return "v2";
  return "v1";
}

/** 보호소 + v2 일 때만 새 신뢰 가이드 UI */
export function isShelterTrustLayout(
  page: Pick<
    RegionalLandingPage,
    "layoutVersion" | "category" | "faqItems" | "seoBlocks" | "publishSource"
  >
): boolean {
  return (
    resolvePageCategory(page) === "shelter" &&
    resolveRegionalLayoutVersion(page) === "v2"
  );
}
