import { NextResponse } from "next/server";
import { isAdminConfigured, verifyAdminSecret } from "@/lib/academy/admin-auth";
import { getAcademies, setAcademyPremium } from "@/lib/academy/queries";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "관리자 인증이 필요합니다." }, { status: 401 });
}

export async function GET(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "ACADEMY_ADMIN_SECRET 환경 변수가 설정되지 않았습니다." },
      { status: 503 }
    );
  }

  if (!verifyAdminSecret(request)) {
    return unauthorized();
  }

  const academies = await getAcademies();
  return NextResponse.json({
    academies: academies.map((a) => ({
      slug: a.slug,
      name: a.name,
      region_big: a.region_big,
      region_small: a.region_small,
      is_premium: a.is_premium,
      created_at: a.created_at,
    })),
  });
}

export async function PATCH(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "ACADEMY_ADMIN_SECRET 환경 변수가 설정되지 않았습니다." },
      { status: 503 }
    );
  }

  if (!verifyAdminSecret(request)) {
    return unauthorized();
  }

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

    const result = await setAcademyPremium(slug.trim(), isPremium);

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
      storage: "supabase",
    });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
