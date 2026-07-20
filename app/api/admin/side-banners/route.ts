import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  MAIN_ADMIN_COOKIE,
  verifyMainAdminSessionToken,
} from "@/lib/admin/main-auth-core";
import {
  createSiteSideBanner,
  deleteSiteSideBanner,
  listSiteSideBanners,
  updateSiteSideBanner,
} from "@/lib/site/side-banners-store";
import type { SiteBannerSlot } from "@/lib/types/site-banner";

async function requireMainAdmin(): Promise<NextResponse | null> {
  const jar = await cookies();
  const token = jar.get(MAIN_ADMIN_COOKIE)?.value;
  if (!verifyMainAdminSessionToken(token)) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  return null;
}

export async function GET() {
  const denied = await requireMainAdmin();
  if (denied) return denied;

  const banners = await listSiteSideBanners({ enabledOnly: false });
  return NextResponse.json({ banners });
}

export async function POST(request: Request) {
  const denied = await requireMainAdmin();
  if (denied) return denied;

  const body = await request.json();
  const result = await createSiteSideBanner({
    slot: body.slot as SiteBannerSlot,
    title: String(body.title ?? ""),
    image_url: String(body.image_url ?? ""),
    href: String(body.href ?? "/"),
    enabled: body.enabled !== false,
    sort_order: Number(body.sort_order ?? 0),
  });
  if (result.error || !result.data) {
    return NextResponse.json(
      { error: result.error ?? "저장 실패" },
      { status: 400 }
    );
  }
  return NextResponse.json({ banner: result.data });
}

export async function PATCH(request: Request) {
  const denied = await requireMainAdmin();
  if (denied) return denied;

  const body = await request.json();
  const id = String(body.id ?? "");
  if (!id) {
    return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
  }

  const result = await updateSiteSideBanner(id, {
    slot: body.slot,
    title: body.title,
    image_url: body.image_url,
    href: body.href,
    enabled: body.enabled,
    sort_order: body.sort_order,
  });
  if (result.error || !result.data) {
    return NextResponse.json(
      { error: result.error ?? "수정 실패" },
      { status: 400 }
    );
  }
  return NextResponse.json({ banner: result.data });
}

export async function DELETE(request: Request) {
  const denied = await requireMainAdmin();
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id") ?? "";
  if (!id) {
    return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
  }
  const result = await deleteSiteSideBanner(id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
