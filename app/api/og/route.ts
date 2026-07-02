import { NextResponse } from "next/server";
import { renderOgImagePng } from "@/lib/seo/og-image-render";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const subtitle = searchParams.get("subtitle")?.trim();

  if (!subtitle || subtitle.length > 80) {
    return NextResponse.json({ error: "subtitle 필요 (최대 80자)" }, { status: 400 });
  }

  try {
    const png = await renderOgImagePng(subtitle);
    return new NextResponse(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "OG 생성 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
