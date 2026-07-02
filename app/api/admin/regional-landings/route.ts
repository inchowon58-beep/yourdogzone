import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  MAIN_ADMIN_COOKIE,
  verifyMainAdminSessionToken,
} from "@/lib/admin/main-auth-core";
import {
  deleteRegionalLanding,
  upsertRegionalLanding,
} from "@/lib/academy/regional-store";
import {
  getRegionalLandingForAdmin,
  listRegionalLandingsForAdmin,
} from "@/lib/academy/regional-admin-list";
import { generateRegionalLandingFromKeyword } from "@/lib/academy/regional-generator";
import { runRegionalPageBackfill } from "@/lib/academy/regional-backfill";
import { scheduleRegionalPageWarmup } from "@/lib/academy/regional-page-warmup";
import { getNearbyDistricts } from "@/lib/constants/region-nearby-districts";
import { getNearbyStations } from "@/lib/constants/region-nearby-stations";
import type { RegionalLandingInsert } from "@/lib/types/regional-landing";
import { revalidatePath } from "next/cache";

async function requireMainAdmin(): Promise<NextResponse | null> {
  const jar = await cookies();
  const token = jar.get(MAIN_ADMIN_COOKIE)?.value;
  if (!verifyMainAdminSessionToken(token)) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  return null;
}

function revalidateRegional(slug?: string) {
  revalidatePath("/services/academy/region/[slug]", "page");
  revalidatePath("/sitemap.xml");
  if (slug) {
    revalidatePath(`/services/academy/region/${slug}`);
    scheduleRegionalPageWarmup(slug);
  }
}

export async function GET(request: Request) {
  const denied = await requireMainAdmin();
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "10");

  const result = await listRegionalLandingsForAdmin({ page, limit });
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const denied = await requireMainAdmin();
  if (denied) return denied;

  let body: {
    action?: string;
    keyword?: string;
    slug?: string;
    isPublished?: boolean;
    page?: RegionalLandingInsert;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }

  if (body.action === "toggle_publish") {
    const slug = body.slug?.trim();
    if (!slug || typeof body.isPublished !== "boolean") {
      return NextResponse.json({ error: "slug, isPublished 필요" }, { status: 400 });
    }
    const existing = await getRegionalLandingForAdmin(slug);
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
    revalidateRegional(result.page.slug);
    return NextResponse.json({ page: result.page });
  }

  if (body.action === "generate") {
    const keyword = body.keyword?.trim();
    if (!keyword) {
      return NextResponse.json({ error: "키워드를 입력하세요." }, { status: 400 });
    }
    try {
      const draft = await generateRegionalLandingFromKeyword(keyword);
      const result = await upsertRegionalLanding(draft);
      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
      revalidateRegional(result.page.slug);
      if (draft.geminiError) {
        void runRegionalPageBackfill(result.page.slug);
      }
      return NextResponse.json({
        page: result.page,
        generated: true,
        geminiUsed: draft.geminiUsed ?? false,
        geminiError: draft.geminiError,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "생성 실패";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }

  if (body.action === "generate_batch") {
    const keywords = (body.keyword ?? "")
      .split(/\n/)
      .map((k) => k.trim())
      .filter(Boolean);
    const created = [];
    const errors: string[] = [];
    for (const kw of keywords) {
      try {
        const draft = await generateRegionalLandingFromKeyword(kw);
        const result = await upsertRegionalLanding(draft);
        if ("error" in result) errors.push(`${kw}: ${result.error}`);
        else created.push(result.page);
      } catch (e) {
        errors.push(`${kw}: ${e instanceof Error ? e.message : "실패"}`);
      }
    }
    revalidateRegional();
    for (const page of created) {
      scheduleRegionalPageWarmup(page.slug);
    }
    return NextResponse.json({
      pages: created,
      errors,
      geminiCount: created.filter((p) => p.seoBlocks?.length).length,
    });
  }

  const page = body.page;
  if (!page?.slug || !page.label) {
    return NextResponse.json({ error: "page.slug, page.label 필수" }, { status: 400 });
  }

  const result = await upsertRegionalLanding({
    ...page,
    nearbySlugs: (page.nearbySlugs ?? []).slice(0, 5),
    nearbyAreas: (page.nearbyAreas ?? getNearbyDistricts(page.label, 5)).slice(0, 5),
    nearbyStations: (page.nearbyStations ?? getNearbyStations(page.label, 5)).slice(0, 5),
    keyword: page.keyword || `${page.label} 애견미용학원`,
    isPublished: page.isPublished ?? true,
  });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  revalidateRegional(result.page.slug);
  return NextResponse.json({ page: result.page });
}

export async function DELETE(request: Request) {
  const denied = await requireMainAdmin();
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "slug 필요" }, { status: 400 });
  }

  const result = await deleteRegionalLanding(slug);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }
  revalidateRegional(slug);
  return NextResponse.json({ ok: true });
}
