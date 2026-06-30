import { refineAcademyCopyWithGemini } from "@/lib/ai/gemini";
import { countAcademyImages, splitAcademyImages } from "@/lib/academy/images";
import { insertAcademy } from "@/lib/academy/queries";
import { parseKoreanAddress } from "@/lib/academy/parse-address";
import { generateAcademySlug } from "@/lib/academy/slug";
import { academyPageUrl, submitToIndexNow } from "@/lib/indexnow/submit";
import {
  completeR2Uploads,
  mirrorExternalImagesToR2,
  resolveExternalImageUrl,
} from "@/lib/upload/r2-mirror";

export type BulkAcademyInput = {
  name: string;
  address: string;
  phone?: string | null;
  description?: string | null;
  title_copy?: string | null;
  curriculum?: string | null;
  tuition_info?: string | null;
  kakao_url?: string | null;
  region_big?: string | null;
  region_small?: string | null;
  image_urls?: string[];
  logo_image?: string | null;
  academy_images?: string[];
  is_premium?: boolean;
  naver_place_url?: string | null;
  seo_title_suffix?: string | null;
};

export type BulkRegisterOptions = {
  refineWithGemini?: boolean;
  skipImageMirror?: boolean;
};

export type BulkRegisterItemResult = {
  ok: boolean;
  name: string;
  slug?: string;
  url?: string;
  storage?: "r2" | "supabase";
  imageCount?: number;
  imageErrors?: string[];
  geminiRefined?: boolean;
  geminiSkipReason?: string;
  indexnow?: { ok: boolean; status: number; message: string };
  error?: string;
};

export async function bulkRegisterAcademy(
  input: BulkAcademyInput,
  options: BulkRegisterOptions = {}
): Promise<BulkRegisterItemResult> {
  const name = input.name?.trim();
  const address = input.address?.trim();

  if (!name || !address) {
    return { ok: false, name: name ?? "(이름 없음)", error: "name과 address는 필수입니다." };
  }

  const { region_big, region_small } =
    input.region_big && input.region_small
      ? { region_big: input.region_big, region_small: input.region_small }
      : parseKoreanAddress(address);

  let title_copy =
    input.title_copy?.trim() ||
    input.description?.trim().slice(0, 80) ||
    `${name} 애견미용학원`;
  let curriculum = input.curriculum?.trim() || input.description?.trim() || null;
  let tuition_info = input.tuition_info?.trim() || null;
  let geminiRefined = false;
  let geminiSkipReason: string | undefined;

  const clientPreRefined = Boolean(
    input.title_copy?.trim() && input.curriculum?.trim()
  );

  const geminiRequested =
    options.refineWithGemini !== false && !clientPreRefined;
  const geminiAvailable = Boolean(process.env.GEMINI_API_KEY?.trim());

  if (geminiRequested && !geminiAvailable) {
    geminiSkipReason = "서버에 GEMINI_API_KEY가 설정되지 않았습니다 (Vercel 환경변수 확인)";
  } else if (geminiRequested && input.description?.trim()) {
    const refined = await refineAcademyCopyWithGemini(
      name,
      input.description,
      address
    );
    if (refined.ok) {
      title_copy = refined.data.title_copy;
      curriculum = refined.data.curriculum;
      tuition_info = refined.data.tuition_info;
      geminiRefined = true;
    } else {
      geminiSkipReason = refined.error;
    }
  }

  const r2Images: string[] = [
    ...(input.logo_image?.startsWith("http") ? [input.logo_image] : []),
    ...(input.academy_images ?? []),
  ];
  let imageErrors: string[] = [];

  if (!options.skipImageMirror && input.image_urls?.length) {
    const mirrored = await mirrorExternalImagesToR2(input.image_urls, 3);
    r2Images.push(...mirrored.urls);
    imageErrors = mirrored.errors;

    if (r2Images.length === 0) {
      const fallback = input.image_urls
        .slice(0, 3)
        .map(resolveExternalImageUrl)
        .filter((u) => u.startsWith("https://"));
      if (fallback.length) {
        r2Images.push(...fallback);
        imageErrors.push(
          `R2 미러 실패(${imageErrors[0]?.split(":").pop()?.trim() ?? "원인 불명"}) — 네이버 URL로 저장`
        );
      }
    }
  }

  const uniqueImages = [...new Set(r2Images.filter((u) => u.startsWith("http")))];
  const { logo_image, academy_images } = splitAcademyImages(uniqueImages);

  const slug = generateAcademySlug();

  const insertResult = await insertAcademy({
    slug,
    name,
    region_big,
    region_small,
    title_copy,
    phone: input.phone?.trim() || null,
    address,
    curriculum,
    tuition_info,
    kakao_url: input.kakao_url?.trim() || null,
    seo_title_suffix: input.seo_title_suffix?.trim() || null,
    logo_image,
    academy_images,
    is_premium: input.is_premium ?? false,
  });

  if (insertResult.error || !insertResult.data) {
    return {
      ok: false,
      name,
      error: insertResult.error ?? "등록에 실패했습니다.",
      imageErrors: imageErrors.length ? imageErrors : undefined,
    };
  }

  try {
    if (insertResult.uploads?.length) {
      await completeR2Uploads(insertResult.uploads);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "R2 저장 실패";
    return {
      ok: false,
      name,
      slug: insertResult.data.slug,
      error: message,
      imageErrors: imageErrors.length ? imageErrors : undefined,
    };
  }

  const pageUrl = academyPageUrl(insertResult.data.slug);
  const indexnow = await submitToIndexNow([pageUrl]);

  return {
    ok: true,
    name,
    slug: insertResult.data.slug,
    url: pageUrl,
    storage: insertResult.uploads?.length ? "r2" : "supabase",
    imageCount: countAcademyImages(logo_image, academy_images),
    imageErrors: imageErrors.length ? imageErrors : undefined,
    geminiRefined: clientPreRefined || geminiRefined,
    geminiSkipReason,
    indexnow,
  };
}

export async function bulkRegisterAcademies(
  items: BulkAcademyInput[],
  options: BulkRegisterOptions = {}
): Promise<{
  total: number;
  succeeded: number;
  failed: number;
  results: BulkRegisterItemResult[];
}> {
  const results: BulkRegisterItemResult[] = [];

  for (const item of items) {
    results.push(await bulkRegisterAcademy(item, options));
  }

  const succeeded = results.filter((r) => r.ok).length;
  return {
    total: results.length,
    succeeded,
    failed: results.length - succeeded,
    results,
  };
}
