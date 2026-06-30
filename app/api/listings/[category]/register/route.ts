import { NextRequest, NextResponse } from "next/server";
import { isListingCategory, getListingConfig } from "@/lib/listings/config";
import { insertListing } from "@/lib/listings/queries";
import { generateListingSlug, listingPageUrl } from "@/lib/listings/slug";
import { submitToIndexNow } from "@/lib/indexnow/submit";
import type { ListingCategory } from "@/lib/types/listing";

type RouteContext = { params: Promise<{ category: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { category: raw } = await context.params;
  if (!isListingCategory(raw)) {
    return NextResponse.json({ error: "지원하지 않는 카테고리입니다." }, { status: 400 });
  }
  const category = raw as ListingCategory;
  const config = getListingConfig(category);

  try {
    const body = await request.json();
    const {
      name,
      region_big,
      region_small,
      title_copy,
      phone,
      address,
      service_info,
      extra_info,
      extra_info_2,
      kakao_url,
      logo_image,
      gallery_images,
    } = body;

    if (!name?.trim() || !region_big || !region_small?.trim() || !address?.trim()) {
      return NextResponse.json(
        { error: `필수 항목(${config.singular}명, 지역, 주소)을 입력해 주세요.` },
        { status: 400 }
      );
    }

    const slug = generateListingSlug(category);
    const logoImage =
      typeof logo_image === "string" && logo_image.startsWith("http")
        ? logo_image
        : null;
    const galleryImages = Array.isArray(gallery_images)
      ? gallery_images.filter(
          (url): url is string => typeof url === "string" && url.startsWith("http")
        )
      : null;

    const insertResult = await insertListing({
      slug,
      category,
      name: name.trim(),
      region_big,
      region_small: region_small.trim(),
      title_copy:
        title_copy?.trim() || `${name} ${config.defaultTitleSuffix}`,
      phone: phone?.trim() || null,
      address: address.trim(),
      service_info: service_info?.trim() || null,
      extra_info: extra_info?.trim() || null,
      extra_info_2: extra_info_2?.trim() || null,
      kakao_url: kakao_url?.trim() || null,
      logo_image: logoImage,
      gallery_images: galleryImages?.length ? galleryImages : null,
      is_premium: false,
    });

    const { data, error } = insertResult;
    if (error || !data) {
      return NextResponse.json(
        { error: error ?? "등록에 실패했습니다." },
        { status: 500 }
      );
    }

    const url = listingPageUrl(category, data.slug);
    const indexResult = await submitToIndexNow([url]);

    if (insertResult.uploads?.length) {
      return NextResponse.json({
        slug: data.slug,
        url,
        storage: "r2",
        uploads: insertResult.uploads,
        indexnow: indexResult,
      });
    }

    return NextResponse.json({
      slug: data.slug,
      url,
      storage: "r2",
      indexnow: indexResult,
    });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
