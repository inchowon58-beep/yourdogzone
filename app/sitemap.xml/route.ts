import { chunkPublicUrl } from "@/lib/seo/sitemap-build";
import {
  buildSitemapIndexXml,
  sitemapXmlResponse,
} from "@/lib/seo/sitemap-xml";
import { SITEMAP_CHUNK_NAMES } from "@/lib/seo/sitemap-types";

export const runtime = "nodejs";
export const revalidate = 43200;

export async function GET() {
  const locations = SITEMAP_CHUNK_NAMES.map((name) => chunkPublicUrl(name));
  const xml = buildSitemapIndexXml(locations);
  return sitemapXmlResponse(xml);
}
