import { NextResponse } from "next/server";
import { getCachedSitemapChunk } from "@/lib/seo/sitemap-cache";
import {
  entriesToUrlsetXml,
  sitemapXmlResponse,
} from "@/lib/seo/sitemap-xml";
import { isSitemapChunkName } from "@/lib/seo/sitemap-types";

export const runtime = "nodejs";
export const revalidate = 43200;

type RouteParams = { params: Promise<{ name: string }> };

function normalizeChunkName(raw: string): string {
  return raw.endsWith(".xml") ? raw.slice(0, -4) : raw;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { name: rawName } = await params;
  const name = normalizeChunkName(rawName);

  if (!isSitemapChunkName(name)) {
    return NextResponse.json({ error: "사이트맵을 찾을 수 없습니다." }, { status: 404 });
  }

  const entries = await getCachedSitemapChunk(name);
  return sitemapXmlResponse(entriesToUrlsetXml(entries));
}
