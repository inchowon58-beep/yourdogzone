export const SITE_NAME = "유아독존";
export const SITE_DESCRIPTION =
  "애견미용학원, 애견샵, 보호소, 장례식장, 브리더, 견종소개, 동물병원, Q&A까지 — 반려견 생활의 모든 것을 한곳에서.";

const DEFAULT_PRODUCTION_URL = "https://www.yourdogzone.co.kr";

export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) {
    const normalized = fromEnv.startsWith("http")
      ? fromEnv.replace(/\/$/, "")
      : `https://${fromEnv.replace(/\/$/, "")}`;
    // IndexNow·OG·canonical — 프로덕션은 www 고정
    if (
      normalized.includes("yourdogzone.co.kr") &&
      !normalized.includes("www.yourdogzone.co.kr")
    ) {
      return DEFAULT_PRODUCTION_URL;
    }
    return normalized;
  }

  // Vercel 내부 URL(*.vercel.app)은 접근 제한될 수 있으므로 프로덕션은 실제 도메인 사용
  if (process.env.VERCEL_ENV === "production") {
    return DEFAULT_PRODUCTION_URL;
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/\/$/, "")}`;
  }

  return "http://localhost:3000";
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
