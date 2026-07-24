import type { RegionalLandingPage } from "@/lib/types/regional-landing";
import { resolvePageCategory } from "@/lib/seo/regional-service-config";

/** SEO 레이아웃 버전 */
export type RegionalLayoutVersion = "v1" | "v2";

/** 로컬 SEO 보호소 템플릿 흔적 — layoutVersion 없이 올라간 발행분 복구용 */
function looksLikeOfflineShelterSeo(
  page: Pick<RegionalLandingPage, "faqItems" | "seoBlocks" | "publishSource">
): boolean {
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

function looksLikeOfflineAdoptionSeo(
  page: Pick<RegionalLandingPage, "formId" | "faqItems" | "seoBlocks">
): boolean {
  if (page.formId) return true;
  const text = [
    ...(page.faqItems ?? []).map((f) => `${f.question} ${f.answer}`),
    ...(page.seoBlocks ?? []).map(
      (b) => `${b.title} ${(b.paragraphs ?? []).join(" ")}`
    ),
  ].join(" ");
  return /분양 전 체크|충동 분양|건강보증|사육 환경|골든두들|메인쿤|랙돌|폼스키|꼬똥드툴레아/.test(
    text
  );
}

/**
 * v1 — 기존 RegionalAcademySeoSection
 * v2 — TrustGuide (보호소/분양 로컬 SEO)
 */
export function resolveRegionalLayoutVersion(
  page: Pick<
    RegionalLandingPage,
    | "layoutVersion"
    | "faqItems"
    | "seoBlocks"
    | "publishSource"
    | "formId"
    | "category"
  >
): RegionalLayoutVersion {
  if (page.layoutVersion === "v2") return "v2";
  if (page.layoutVersion === "v1") return "v1";
  const category = resolvePageCategory(page);
  if (category === "shelter" && looksLikeOfflineShelterSeo(page)) return "v2";
  if (category === "adoption" && looksLikeOfflineAdoptionSeo(page)) return "v2";
  if (page.publishSource === "offline-seo" && category === "shelter") {
    return "v2";
  }
  return "v1";
}

/** 보호소 + v2 → ShelterRegionalTrustGuide */
export function isShelterTrustLayout(
  page: Pick<
    RegionalLandingPage,
    | "layoutVersion"
    | "category"
    | "faqItems"
    | "seoBlocks"
    | "publishSource"
    | "formId"
  >
): boolean {
  return (
    resolvePageCategory(page) === "shelter" &&
    resolveRegionalLayoutVersion(page) === "v2"
  );
}

/** 분양 + v2 → AdoptionRegionalTrustGuide */
export function isAdoptionTrustLayout(
  page: Pick<
    RegionalLandingPage,
    | "layoutVersion"
    | "category"
    | "faqItems"
    | "seoBlocks"
    | "publishSource"
    | "formId"
  >
): boolean {
  return (
    resolvePageCategory(page) === "adoption" &&
    resolveRegionalLayoutVersion(page) === "v2"
  );
}
