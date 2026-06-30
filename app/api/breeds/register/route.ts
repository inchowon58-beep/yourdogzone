import { NextRequest, NextResponse } from "next/server";
import { upsertBreed } from "@/lib/breeds/queries";
import { breedPageUrl } from "@/lib/breeds/slug";
import { submitToIndexNow } from "@/lib/indexnow/submit";
import type { BreedInsert, BreedKind, BreedSizeGroup } from "@/lib/types/breed";
import { BREED_SIZE_LABELS } from "@/lib/breeds/config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      slug,
      name_ko,
      name_en,
      kind,
      size_group,
      size_label,
      origin,
      summary,
      history,
      personality,
      appearance,
      grooming,
      exercise,
      health,
      training,
      living,
      lifespan,
      weight,
      height,
      hero_image,
      gallery_images,
      tags,
    } = body;

    if (!slug?.trim() || !name_ko?.trim() || !summary?.trim()) {
      return NextResponse.json(
        { error: "필수 항목(slug, 견종명, 한 줄 소개)을 입력해 주세요." },
        { status: 400 }
      );
    }

    const validKinds: BreedKind[] = ["purebred", "designer"];
    const validSizes: BreedSizeGroup[] = ["toy", "small", "medium", "large", "giant"];
    const breedKind: BreedKind = validKinds.includes(kind) ? kind : "purebred";
    const breedSize: BreedSizeGroup = validSizes.includes(size_group)
      ? size_group
      : "small";

    const heroImage =
      typeof hero_image === "string" && hero_image.startsWith("http")
        ? hero_image
        : null;
    const galleryImages = Array.isArray(gallery_images)
      ? gallery_images.filter(
          (url): url is string => typeof url === "string" && url.startsWith("http")
        )
      : null;

    const payload: BreedInsert = {
      slug: slug.trim(),
      name_ko: name_ko.trim(),
      name_en: name_en?.trim() || name_ko.trim(),
      kind: breedKind,
      size_group: breedSize,
      size_label:
        typeof size_label === "string" && size_label.trim()
          ? size_label.trim()
          : BREED_SIZE_LABELS[breedSize],
      origin: origin?.trim() || "",
      summary: summary.trim(),
      history: history?.trim() || "",
      personality: personality?.trim() || "",
      appearance: appearance?.trim() || "",
      grooming: grooming?.trim() || "",
      exercise: exercise?.trim() || "",
      health: health?.trim() || "",
      training: training?.trim() || "",
      living: living?.trim() || "",
      lifespan: lifespan?.trim() || "",
      weight: weight?.trim() || "",
      height: height?.trim() || "",
      hero_image: heroImage,
      gallery_images: galleryImages?.length ? galleryImages : null,
      tags: Array.isArray(tags)
        ? tags
            .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
            .map((t) => t.trim())
        : [],
    };

    const result = await upsertBreed(payload);
    if (result.error || !result.data) {
      return NextResponse.json(
        { error: result.error ?? "등록에 실패했습니다." },
        { status: 500 }
      );
    }

    const url = breedPageUrl(result.data.slug);
    const indexResult = await submitToIndexNow([url]);

    if (result.uploads?.length) {
      return NextResponse.json({
        slug: result.data.slug,
        url,
        storage: "r2",
        uploads: result.uploads,
        indexnow: indexResult,
      });
    }

    return NextResponse.json({
      slug: result.data.slug,
      url,
      storage: "r2",
      indexnow: indexResult,
    });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
