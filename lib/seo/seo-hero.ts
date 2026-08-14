export const SEO_HERO_PLACEHOLDER = "{{SEO_HERO}}";
export const DEFAULT_SEO_HERO_OVERLAY = "#312e81";

export function normalizeSeoHeroOverlay(input: string | null | undefined): string | null {
  const trimmed = input?.trim() ?? "";
  if (!trimmed) return null;
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const r = trimmed[1];
    const g = trimmed[2];
    const b = trimmed[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return null;
}

/** HTML을 히어로 삽입 지점(플레이스홀더 또는 '안심 공약') 기준으로 나눔 */
export function splitSeoHtmlAroundHero(html: string): {
  before: string;
  after: string;
} {
  const placeholderIndex = html.indexOf(SEO_HERO_PLACEHOLDER);
  if (placeholderIndex >= 0) {
    return {
      before: html.slice(0, placeholderIndex),
      after: html.slice(placeholderIndex + SEO_HERO_PLACEHOLDER.length),
    };
  }

  const commentIndex = html.indexOf("<!--SEO_HERO-->");
  if (commentIndex >= 0) {
    return {
      before: html.slice(0, commentIndex),
      after: html.slice(commentIndex + "<!--SEO_HERO-->".length),
    };
  }

  const blockRe = /<(p|h2|h3|div|section)[^>]*>[\s\S]{0,280}?안심\s*공약/i;
  const match = html.match(blockRe);
  if (match?.index !== undefined) {
    return {
      before: html.slice(0, match.index),
      after: html.slice(match.index),
    };
  }

  return { before: "", after: html };
}
