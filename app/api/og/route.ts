import { NextResponse } from "next/server";
import {
  renderOgImagePng,
  renderPhotoHeroOgPng,
} from "@/lib/seo/og-image-render";

export const runtime = "nodejs";

function isAllowedBgUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    // 외부 임의 호스트 SSRF 완화 — CDN·자체 도메인만
    const host = u.hostname.toLowerCase();
    return (
      host.endsWith("cattery.co.kr") ||
      host.endsWith("yourdogzone.co.kr") ||
      host.endsWith("r2.dev") ||
      host.endsWith("cloudflarestorage.com") ||
      host.includes("cdn")
    );
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode")?.trim();

  if (mode === "photo") {
    const bg = searchParams.get("bg")?.trim() ?? "";
    const title = searchParams.get("title")?.trim() ?? "";
    const badge = searchParams.get("badge")?.trim() || "유아독존";
    const line2 = searchParams.get("line2")?.trim() || "";
    const bar = searchParams.get("bar")?.trim() || "";

    if (!bg || !isAllowedBgUrl(bg)) {
      return NextResponse.json(
        { error: "허용된 배경 이미지 URL이 필요합니다." },
        { status: 400 }
      );
    }
    if (!title || title.length > 80) {
      return NextResponse.json(
        { error: "title 필요 (최대 80자)" },
        { status: 400 }
      );
    }

    try {
      const png = await renderPhotoHeroOgPng({
        backgroundUrl: bg,
        badge,
        title,
        line2,
        bar,
      });
      return new NextResponse(new Uint8Array(png), {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=86400, s-maxage=604800",
        },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "OG 생성 실패";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

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
