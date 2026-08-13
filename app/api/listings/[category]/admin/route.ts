import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { enforceAdminAccess } from "@/lib/academy/admin-auth";
import { isListingCategory, listingBasePath } from "@/lib/listings/config";
import {
  deleteListings,
  getListingBySlug,
  getListings,
  setListingPremium,
  updateListingFields,
} from "@/lib/listings/queries";
import { completeR2Uploads } from "@/lib/upload/r2-mirror";
import { invalidateListingRegionalIndexMemoryCache } from "@/lib/academy/regional-entity-index";
import type { ListingCategory } from "@/lib/types/listing";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ category: string }> };

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

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug")?.trim();

  if (slug) {
    const listing = await getListingBySlug(category, slug);
    if (!listing) {
      return NextResponse.json({ error: "업체를 찾을 수 없습니다." }, { status: 404 });
    }
    return NextResponse.json({ listing });
  }

  const listings = await getListings(category, { noCache: true });
  return NextResponse.json({
    category,
    listings: listings.map((item) => ({
      slug: item.slug,
      name: item.name,
      region_big: item.region_big,
      region_small: item.region_small,
      is_premium: item.is_premium,
      created_at: item.created_at,
      phone: item.phone,
      address: item.address,
      logo_image: item.logo_image,
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

    if (!slug?.trim()) {
      return NextResponse.json({ error: "slug가 필요합니다." }, { status: 400 });
    }

    // 기존: 추천 on/off
    if (typeof body.is_premium === "boolean" && body.action !== "update") {
      const result = await setListingPremium(category, slug.trim(), body.is_premium);
      if (result.error || !result.data) {
        return NextResponse.json(
          { error: result.error ?? "변경에 실패했습니다." },
          { status: 400 }
        );
      }

      if (result.uploads?.length) {
        await completeR2Uploads(result.uploads);
        invalidateListingRegionalIndexMemoryCache(category);
      }

      const base = listingBasePath(category);
      revalidatePath(`${base}/${result.data.slug}`);
      revalidatePath(base);
      revalidatePath("/sitemap.xml");

      return NextResponse.json({
        ok: true,
        slug: result.data.slug,
        is_premium: result.data.is_premium,
        storage: "r2",
      });
    }

    // 정보 수정
    const result = await updateListingFields(category, slug.trim(), {
      name: body.name,
      address: body.address,
      phone: body.phone,
      title_copy: body.title_copy,
      region_big: body.region_big,
      region_small: body.region_small,
      logo_image: body.logo_image,
      gallery_images: body.gallery_images,
      service_info: body.service_info,
      extra_info: body.extra_info,
      extra_info_2: body.extra_info_2,
      naver_place_url: body.naver_place_url,
      kakao_url: body.kakao_url,
    });

    if (result.error || !result.data) {
      return NextResponse.json(
        { error: result.error ?? "수정에 실패했습니다." },
        { status: 400 }
      );
    }

    if (result.uploads?.length) {
      await completeR2Uploads(result.uploads);
      invalidateListingRegionalIndexMemoryCache(category);
    }

    const base = listingBasePath(category);
    revalidatePath(`${base}/${result.data.slug}`);
    revalidatePath(base);
    revalidatePath("/sitemap.xml");

    return NextResponse.json({
      ok: true,
      listing: result.data,
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
      invalidateListingRegionalIndexMemoryCache(category);
    }

    const base = listingBasePath(category);
    for (const s of result.deleted) {
      revalidatePath(`${base}/${s}`);
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
