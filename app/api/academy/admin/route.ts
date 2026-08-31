import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { enforceAdminAccess } from "@/lib/academy/admin-auth";
import { invalidateAcademyIndexMemoryCache } from "@/lib/academy/academy-index";
import { deleteAcademies, getAcademies, setAcademyPremium } from "@/lib/academy/queries";
import { getAllRegionalLandings } from "@/lib/academy/regional-store";
import { completeR2Uploads } from "@/lib/upload/r2-mirror-core";

async function revalidateRegionalLandingPages() {
  const pages = await getAllRegionalLandings({ includeUnpublished: true });
  for (const page of pages) {
    revalidatePath(`/services/academy/region/${page.slug}`);
  }
  revalidatePath("/services/academy/region/[slug]", "page");
}

export const runtime = "nodejs";

export async function GET(request: Request) {
  const denied = await enforceAdminAccess(request);
  if (denied) return denied;

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

    const result = await setAcademyPremium(slug.trim(), isPremium);

    if (result.error || !result.data) {
      return NextResponse.json(
        { error: result.error ?? "변경에 실패했습니다." },
        { status: 400 }
      );
    }

    if (result.uploads?.length) {
      await completeR2Uploads(result.uploads);
      invalidateAcademyIndexMemoryCache();
    }

    revalidatePath(`/services/academy/${result.data.slug}`);
    revalidatePath("/services/academy");
    await revalidateRegionalLandingPages();

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

export async function DELETE(request: Request) {
  const denied = await enforceAdminAccess(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const slugs: string[] = Array.isArray(body.slugs)
      ? body.slugs
      : typeof body.slug === "string"
        ? [body.slug]
        : [];

    const result = await deleteAcademies(slugs);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    if (result.uploads?.length) {
      await completeR2Uploads(result.uploads);
      invalidateAcademyIndexMemoryCache();
    }

    for (const slug of result.deleted) {
      revalidatePath(`/services/academy/${slug}`);
    }
    revalidatePath("/services/academy");
    revalidatePath("/sitemap.xml");

    return NextResponse.json({
      ok: true,
      deleted: result.deleted,
      count: result.deleted.length,
      storage: result.uploads?.length ? "r2" : "supabase",
    });
  } catch (error) {
    console.error("academy delete 오류:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
