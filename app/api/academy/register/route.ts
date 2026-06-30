import { NextRequest, NextResponse } from "next/server";
import { generateAcademySlug } from "@/lib/academy/slug";
import { insertAcademy } from "@/lib/academy/queries";
import { academyPageUrl, submitToIndexNow } from "@/lib/indexnow/submit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name,
      region_big,
      region_small,
      title_copy,
      phone,
      address,
      curriculum,
      tuition_info,
      kakao_url,
      logo_image,
      academy_images,
    } = body;

    if (!name?.trim() || !region_big || !region_small?.trim() || !address?.trim()) {
      return NextResponse.json(
        { error: "필수 항목(학원명, 지역, 주소)을 입력해 주세요." },
        { status: 400 }
      );
    }

    const slug = generateAcademySlug();

    const logoImage =
      typeof logo_image === "string" && logo_image.startsWith("http")
        ? logo_image
        : null;
    const galleryImages = Array.isArray(academy_images)
      ? academy_images.filter(
          (url): url is string =>
            typeof url === "string" && url.startsWith("http")
        )
      : null;

    const insertResult = await insertAcademy({
      slug,
      name: name.trim(),
      region_big,
      region_small: region_small.trim(),
      title_copy: title_copy?.trim() || `${name} 애견미용학원`,
      phone: phone?.trim() || null,
      address: address.trim(),
      curriculum: curriculum?.trim() || null,
      tuition_info: tuition_info?.trim() || null,
      kakao_url: kakao_url?.trim() || null,
      logo_image: logoImage,
      academy_images: galleryImages?.length ? galleryImages : null,
      is_premium: false,
    });

    const { data, error } = insertResult;

    if (error || !data) {
      return NextResponse.json(
        { error: error ?? "등록에 실패했습니다." },
        { status: 500 }
      );
    }

    const url = academyPageUrl(data.slug);
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
      storage: "supabase",
      indexnow: indexResult,
    });
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
