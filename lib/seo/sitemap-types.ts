export type SitemapEntry = {
  url: string;
  lastModified?: Date | string;
  changeFrequency?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: number;
};

/** `/sitemaps/{name}` 청크 — 네이버·크롤러가 작은 XML을 빠르게 받도록 분할 */
export const SITEMAP_CHUNK_NAMES = [
  "static",
  "academy",
  "regional",
  "landing",
  "listings-adoption",
  "listings-cafe",
  "listings-hotel",
  "listings-kindergarten",
  "listings-training",
  "listings-shelter",
  "listings-funeral",
  "listings-breeder",
  "listings-hospital",
] as const;

export type SitemapChunkName = (typeof SITEMAP_CHUNK_NAMES)[number];

export function isSitemapChunkName(value: string): value is SitemapChunkName {
  return (SITEMAP_CHUNK_NAMES as readonly string[]).includes(value);
}
