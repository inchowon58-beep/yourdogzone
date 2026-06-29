export const SITE_NAME = "유아독존";
export const SITE_DESCRIPTION =
  "애견미용학원, 강아지분양, 보호소, 장례식장, 브리더, 견종소개, 동물병원, Q&A까지 — 반려견 생활의 모든 것을 한곳에서.";

export function getSiteUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_URL ??
    "http://localhost:3000";

  if (url.startsWith("http")) return url.replace(/\/$/, "");
  return `https://${url.replace(/\/$/, "")}`;
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
