import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminConfigured, verifyAdminSecret } from "@/lib/academy/admin-auth";
import { breedDetailPath } from "@/lib/breeds/config";
import { getBreedBySlug, upsertBreed } from "@/lib/breeds/queries";
import { loadAllBreedsFromR2, normalizeBreedSlug } from "@/lib/breeds/r2-read";
import { completeR2Uploads } from "@/lib/upload/r2-mirror";
import type { BreedInsert, BreedKind, BreedSizeGroup } from "@/lib/types/breed";
import { BREED_SIZE_LABELS } from "@/lib/breeds/config";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ slug: string }> };

function unauthorized() {
  return NextResponse.json({ error: "관리자 인증이 필요합니다." }, { status: 401 });
}

export async function GET(request: Request, context: RouteContext) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "ACADEMY_ADMIN_SECRET 환경 변수가 설정되지 않았습니다." },
      { status: 503 }
    );
  }
  if (!verifyAdminSecret(request)) return unauthorized();

  const { slug: raw } = await context.params;
  const slug = normalizeBreedSlug(raw);
  const breed = await getBreedBySlug(slug);
  if (!breed) {
    return NextResponse.json({ error: "견종을 찾을 수 없습니다." }, { status: 404 });
  }

  const remoteSlugs = new Set((await loadAllBreedsFromR2()).map((b) => b.slug));

  return NextResponse.json({
    breed,
    source: remoteSlugs.has(breed.slug) ? "r2" : "seed",
  });
}

export async function PUT(request: Request, context: RouteContext) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "ACADEMY_ADMIN_SECRET 환경 변수가 설정되지 않았습니다." },
      { status: 503 }
    );
  }
  if (!verifyAdminSecret(request)) return unauthorized();

  const { slug: raw } = await context.params;
  const slug = normalizeBreedSlug(raw);

  const existing = await getBreedBySlug(slug);
  if (!existing) {
    return NextResponse.json({ error: "견종을 찾을 수 없습니다." }, { status: 404 });
  }

  try {
    const body = await request.json();
    const validKinds: BreedKind[] = ["purebred", "designer"];
    const validSizes: BreedSizeGroup[] = ["toy", "small", "medium", "large", "giant"];

    const kind: BreedKind = validKinds.includes(body.kind) ? body.kind : existing.kind;
    const sizeGroup: BreedSizeGroup = validSizes.includes(body.size_group)
      ? body.size_group
      : existing.size_group;

    const heroImage =
      typeof body.hero_image === "string" && body.hero_image.startsWith("http")
        ? body.hero_image
        : body.hero_image === null
          ? null
          : existing.hero_image;
    const galleryImages = Array.isArray(body.gallery_images)
      ? body.gallery_images.filter(
          (url: unknown): url is string => typeof url === "string" && url.startsWith("http")
        )
      : existing.gallery_images;

    const payload: BreedInsert = {
      slug,
      name_ko: (body.name_ko ?? existing.name_ko).trim(),
      name_en: (body.name_en ?? existing.name_en).trim(),
      kind,
      size_group: sizeGroup,
      size_label:
        typeof body.size_label === "string" && body.size_label.trim()
          ? body.size_label.trim()
          : BREED_SIZE_LABELS[sizeGroup],
      origin: (body.origin ?? existing.origin).trim(),
      summary: (body.summary ?? existing.summary).trim(),
      history: (body.history ?? existing.history).trim(),
      personality: (body.personality ?? existing.personality).trim(),
      appearance: (body.appearance ?? existing.appearance).trim(),
      grooming: (body.grooming ?? existing.grooming).trim(),
      exercise: (body.exercise ?? existing.exercise).trim(),
      health: (body.health ?? existing.health).trim(),
      training: (body.training ?? existing.training).trim(),
      living: (body.living ?? existing.living).trim(),
      lifespan: (body.lifespan ?? existing.lifespan).trim(),
      weight: (body.weight ?? existing.weight).trim(),
      height: (body.height ?? existing.height).trim(),
      hero_image: heroImage,
      gallery_images: galleryImages?.length ? galleryImages : null,
      tags: Array.isArray(body.tags)
        ? body.tags
            .filter((t: unknown): t is string => typeof t === "string" && t.trim().length > 0)
            .map((t: string) => t.trim())
        : existing.tags,
    };

    if (!payload.name_ko || !payload.summary) {
      return NextResponse.json(
        { error: "견종명과 한 줄 소개는 필수입니다." },
        { status: 400 }
      );
    }

    const result = await upsertBreed(payload);
    if (result.error || !result.data) {
      return NextResponse.json(
        { error: result.error ?? "저장에 실패했습니다." },
        { status: 500 }
      );
    }

    if (result.uploads?.length) {
      await completeR2Uploads(result.uploads);
    }

    revalidatePath(breedDetailPath(slug));
    revalidatePath("/dognose");
    revalidatePath("/sitemap.xml");

    return NextResponse.json({
      ok: true,
      slug: result.data.slug,
      storage: "r2",
    });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
