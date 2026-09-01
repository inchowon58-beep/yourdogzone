import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { revalidateSitemap } from "@/lib/seo/sitemap-cache";
import { enforceAdminAccess } from "@/lib/academy/admin-auth";
import { listingBasePath } from "@/lib/listings/config";
import {
  importNaverPlaceAsAdoption,
  searchNaverPlaces,
} from "@/lib/listings/naver-place-import";
import { submitToIndexNow } from "@/lib/indexnow/submit";
import { absoluteUrl } from "@/lib/site/config";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const denied = await enforceAdminAccess(request);
  if (denied) return denied;

  let body: {
    action?: string;
    query?: string;
    placeId?: string;
    name?: string;
    address?: string;
    phone?: string | null;
    thumb?: string | null;
    rating?: number | null;
    reviewCount?: number | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const action = body.action ?? "search";

  if (action === "search") {
    const result = await searchNaverPlaces(body.query ?? "");
    if (result.error && result.candidates.length === 0) {
      return NextResponse.json({ error: result.error, candidates: [] }, { status: 404 });
    }
    return NextResponse.json({
      candidates: result.candidates,
      message: result.error,
    });
  }

  if (action === "import") {
    const placeId = body.placeId?.trim();
    if (!placeId) {
      return NextResponse.json({ error: "placeId가 필요합니다." }, { status: 400 });
    }

    const result = await importNaverPlaceAsAdoption({
      placeId,
      name: body.name,
      address: body.address,
      phone: body.phone,
      thumb: body.thumb,
      rating: body.rating,
      reviewCount: body.reviewCount,
    });

    if (!result.ok || !result.slug) {
      return NextResponse.json(
        { error: result.error ?? "등록에 실패했습니다." },
        { status: 400 }
      );
    }

    const base = listingBasePath("adoption");
    revalidatePath(base);
    revalidatePath(`${base}/${result.slug}`);
    revalidateSitemap();

    const pageUrl = result.url ?? absoluteUrl(`${base}/${result.slug}`);
    const indexnow = await submitToIndexNow([pageUrl]);

    return NextResponse.json({
      ok: true,
      slug: result.slug,
      url: pageUrl,
      name: result.name,
      imageCount: result.imageCount,
      indexnow,
    });
  }

  return NextResponse.json(
    { error: "action은 search 또는 import 여야 합니다." },
    { status: 400 }
  );
}
