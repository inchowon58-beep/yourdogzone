import type { SitemapEntry } from "@/lib/seo/sitemap-types";

/** CDN·네이버 Yeti용 — 12시간 캐시, stale 허용 */
export const SITEMAP_CACHE_CONTROL =
  "public, s-maxage=43200, stale-while-revalidate=86400";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatLastmod(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

export function entriesToUrlsetXml(entries: SitemapEntry[]): string {
  const body = entries
    .map((entry) => {
      let inner = `<loc>${escapeXml(entry.url)}</loc>`;
      if (entry.lastModified) {
        inner += `<lastmod>${formatLastmod(entry.lastModified)}</lastmod>`;
      }
      if (entry.changeFrequency) {
        inner += `<changefreq>${entry.changeFrequency}</changefreq>`;
      }
      if (entry.priority != null) {
        inner += `<priority>${entry.priority}</priority>`;
      }
      return `<url>${inner}</url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;
}

export function buildSitemapIndexXml(locations: string[]): string {
  const now = new Date().toISOString();
  const body = locations
    .map(
      (loc) =>
        `<sitemap><loc>${escapeXml(loc)}</loc><lastmod>${now}</lastmod></sitemap>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>`;
}

export function sitemapXmlResponse(xml: string): Response {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": SITEMAP_CACHE_CONTROL,
    },
  });
}
