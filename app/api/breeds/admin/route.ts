import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { revalidateSitemap } from "@/lib/seo/sitemap-cache";
import { enforceAdminAccess } from "@/lib/academy/admin-auth";
import { breedDetailPath } from "@/lib/breeds/config";
import { deleteBreeds, getBreeds } from "@/lib/breeds/queries";
import { loadAllBreedsFromR2 } from "@/lib/breeds/r2-read";
import { completeR2Uploads } from "@/lib/upload/r2-mirror-core";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "관리자 인증이 필요합니다." }, { status: 401 });
}

export async function GET(request: Request) {
  const denied = await enforceAdminAccess(request);
  if (denied) return denied;

  const all = await getBreeds();
  const remoteSlugs = new Set((await loadAllBreedsFromR2()).map((b) => b.slug));

  return NextResponse.json({
    breeds: all.map((item) => ({
      slug: item.slug,
      name_ko: item.name_ko,
      name_en: item.name_en,
      kind: item.kind,
      size_label: item.size_label,
      updated_at: item.updated_at,
      source: remoteSlugs.has(item.slug) ? "r2" : "seed",
    })),
  });
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

    const result = await deleteBreeds(slugs);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    if (result.uploads?.length) {
      await completeR2Uploads(result.uploads);
    }

    for (const slug of result.deleted) {
      revalidatePath(breedDetailPath(slug));
    }
    revalidatePath("/dognose");
    revalidateSitemap();

    return NextResponse.json({
      ok: true,
      deleted: result.deleted,
      count: result.deleted.length,
      storage: "r2",
    });
  } catch (error) {
    console.error("breed delete 오류:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
