import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  MAIN_ADMIN_COOKIE,
  verifyMainAdminSessionToken,
} from "@/lib/admin/main-auth-core";
import { verifyAdminSecret } from "@/lib/academy/admin-auth";
import {
  deleteRegionalLanding,
  insertRegionalLanding,
  upsertRegionalLanding,
} from "@/lib/academy/regional-store";
import {
  getRegionalLandingForAdmin,
  listRegionalLandingsForAdmin,
} from "@/lib/academy/regional-admin-list";
import { generateRegionalLandingFromKeyword } from "@/lib/academy/regional-generator";
import { runRegionalPageBackfill } from "@/lib/academy/regional-backfill";
import { getNearbyDistricts } from "@/lib/constants/region-nearby-districts";
import { getNearbyStations } from "@/lib/constants/region-nearby-stations";
import type { RegionalLandingInsert } from "@/lib/types/regional-landing";
import { revalidatePath } from "next/cache";
import {
  getRegionalServiceConfig,
  isRegionalServiceCategory,
  normalizeRegionalKeyword,
  resolvePageCategory,
  type RegionalServiceCategory,
} from "@/lib/seo/regional-service-config";
import { regionalLandingPathForCategory } from "@/lib/academy/regional-path";
import { absoluteUrl } from "@/lib/site/config";
import { submitToIndexNow } from "@/lib/indexnow/submit";

async function requireMainAdmin(request?: Request): Promise<NextResponse | null> {
  if (request && verifyAdminSecret(request)) {
    return null;
  }
  const jar = await cookies();
  const token = jar.get(MAIN_ADMIN_COOKIE)?.value;
  if (!verifyMainAdminSessionToken(token)) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  return null;
}

function revalidateRegional(category: RegionalServiceCategory, slug?: string) {
  const base = getRegionalServiceConfig(category).basePath;
  revalidatePath(`${base}/region/[slug]`, "page");
  revalidatePath("/sitemap.xml");
  if (slug) {
    revalidatePath(regionalLandingPathForCategory(category, slug));
  }
}

function parseCategory(value: unknown): RegionalServiceCategory {
  if (typeof value === "string" && isRegionalServiceCategory(value)) {
    return value;
  }
  return "academy";
}

function pageAbsoluteUrl(
  category: RegionalServiceCategory,
  slug: string
): string {
  return absoluteUrl(regionalLandingPathForCategory(category, slug));
}

export async function GET(request: Request) {
  const denied = await requireMainAdmin(request);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "10");
  const categoryParam = searchParams.get("category");
  const category =
    categoryParam && isRegionalServiceCategory(categoryParam)
      ? categoryParam
      : undefined;

  const result = await listRegionalLandingsForAdmin({ page, limit, category });
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const denied = await requireMainAdmin(request);
  if (denied) return denied;

  let body: {
    action?: string;
    keyword?: string;
    category?: string;
    slug?: string;
    isPublished?: boolean;
    page?: RegionalLandingInsert;
    submit_indexnow?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }

  if (body.action === "toggle_publish") {
    const slug = body.slug?.trim();
    const category = parseCategory(body.category);
    if (!slug || typeof body.isPublished !== "boolean") {
      return NextResponse.json({ error: "slug, isPublished 필요" }, { status: 400 });
    }
    const existing = await getRegionalLandingForAdmin(slug, category);
    if (!existing) {
      return NextResponse.json({ error: "페이지를 찾을 수 없습니다." }, { status: 404 });
    }
    const result = await upsertRegionalLanding({
      ...existing,
      isPublished: body.isPublished,
    });
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    revalidateRegional(resolvePageCategory(result.page), result.page.slug);
    return NextResponse.json({ page: result.page });
  }

  if (body.action === "generate") {
    const keyword = body.keyword?.trim();
    const category = parseCategory(body.category);
    if (!keyword) {
      return NextResponse.json({ error: "키워드를 입력하세요." }, { status: 400 });
    }
    try {
      const draft = await generateRegionalLandingFromKeyword(keyword, category);
      const result = await insertRegionalLanding(draft);
      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
      revalidateRegional(category, result.page.slug);
      if (draft.geminiError) {
        void runRegionalPageBackfill(result.page.slug);
      }
      const url = pageAbsoluteUrl(category, result.page.slug);
      let indexnow: Awaited<ReturnType<typeof submitToIndexNow>> | null = null;
      if (body.submit_indexnow) {
        indexnow = await submitToIndexNow([url]);
      }
      return NextResponse.json({
        page: result.page,
        url,
        generated: true,
        geminiUsed: draft.geminiUsed ?? false,
        geminiError: draft.geminiError,
        isSlugVariant: draft.isSlugVariant ?? false,
        indexnow,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "생성 실패";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }

  const page = body.page;
  if (!page?.slug || !page.label) {
    return NextResponse.json({ error: "page.slug, page.label 필수" }, { status: 400 });
  }

  const category = resolvePageCategory(page);

  const result = await upsertRegionalLanding({
    ...page,
    category,
    nearbySlugs: (page.nearbySlugs ?? []).slice(0, 5),
    nearbyAreas: (page.nearbyAreas ?? getNearbyDistricts(page.label, 5)).slice(0, 5),
    nearbyStations: (page.nearbyStations ?? getNearbyStations(page.label, 5)).slice(0, 5),
    keyword:
      page.keyword ||
      normalizeRegionalKeyword("", page.label, category),
    isPublished: page.isPublished ?? true,
  });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  revalidateRegional(category, result.page.slug);
  return NextResponse.json({ page: result.page });
}

export async function DELETE(request: Request) {
  const denied = await requireMainAdmin(request);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const categoryParam = searchParams.get("category");
  const category =
    categoryParam && isRegionalServiceCategory(categoryParam)
      ? categoryParam
      : undefined;

  if (!slug) {
    return NextResponse.json({ error: "slug 필요" }, { status: 400 });
  }

  const result = await deleteRegionalLanding(slug, category);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }
  if (category) {
    revalidateRegional(category, slug);
  } else {
    revalidatePath("/sitemap.xml");
  }
  return NextResponse.json({ ok: true });
}
