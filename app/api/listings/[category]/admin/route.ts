import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { enforceAdminAccess } from "@/lib/academy/admin-auth";
import { isListingCategory, listingBasePath } from "@/lib/listings/config";
import {
  deleteListings,
  getListings,
  setListingPremium,
} from "@/lib/listings/queries";
import { completeR2Uploads } from "@/lib/upload/r2-mirror";
import type { ListingCategory } from "@/lib/types/listing";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ category: string }> };

function unauthorized() {
  return NextResponse.json({ error: "관리자 인증이 필요합니다." }, { status: 401 });
}

async function parseCategory(context: RouteContext): Promise<ListingCategory | NextResponse> {
  const { category: raw } = await context.params;
  if (!isListingCategory(raw)) {
    return NextResponse.json({ error: "지원하지 않는 카테고리입니다." }, { status: 400 });
  }
  return raw;
}

export async function GET(request: Request, context: RouteContext) {
  const category = await parseCategory(context);
  if (category instanceof NextResponse) return category;

  const denied = await enforceAdminAccess(request);
  if (denied) return denied;

  const listings = await getListings(category);
  return NextResponse.json({
    category,
    listings: listings.map((item) => ({
      slug: item.slug,
      name: item.name,
      region_big: item.region_big,
      region_small: item.region_small,
      is_premium: item.is_premium,
      created_at: item.created_at,
    })),
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const category = await parseCategory(context);
  if (category instanceof NextResponse) return category;

  const denied = await enforceAdminAccess(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const slug = body.slug as string | undefined;
    const isPremium = body.is_premium as boolean | undefined;

    if (!slug?.trim()) {
      return NextResponse.json({ error: "slug가 필요합니다." }, { status: 400 });
    }
    if (typeof isPremium !== "boolean") {
      return NextResponse.json(
        { error: "is_premium (true/false)이 필요합니다." },
        { status: 400 }
      );
    }

    const result = await setListingPremium(category, slug.trim(), isPremium);
    if (result.error || !result.data) {
      return NextResponse.json(
        { error: result.error ?? "변경에 실패했습니다." },
        { status: 400 }
      );
    }

    if (result.uploads?.length) {
      return NextResponse.json({
        ok: true,
        slug: result.data.slug,
        is_premium: result.data.is_premium,
        storage: "r2",
        uploads: result.uploads,
      });
    }

    return NextResponse.json({
      ok: true,
      slug: result.data.slug,
      is_premium: result.data.is_premium,
      storage: "r2",
    });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const category = await parseCategory(context);
  if (category instanceof NextResponse) return category;

  const denied = await enforceAdminAccess(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const slugs: string[] = Array.isArray(body.slugs)
      ? body.slugs
      : typeof body.slug === "string"
        ? [body.slug]
        : [];

    const result = await deleteListings(category, slugs);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    if (result.uploads?.length) {
      await completeR2Uploads(result.uploads);
    }

    const base = listingBasePath(category);
    for (const slug of result.deleted) {
      revalidatePath(`${base}/${slug}`);
    }
    revalidatePath(base);
    revalidatePath("/sitemap.xml");

    return NextResponse.json({
      ok: true,
      deleted: result.deleted,
      count: result.deleted.length,
      storage: "r2",
    });
  } catch (error) {
    console.error("listing delete 오류:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
