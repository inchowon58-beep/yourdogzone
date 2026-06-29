import { NextResponse } from "next/server";
import {
  bulkRegisterAcademies,
  bulkRegisterAcademy,
  type BulkAcademyInput,
} from "@/lib/academy/bulk-register";
import { isAdminConfigured, verifyAdminSecret } from "@/lib/academy/admin-auth";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BATCH_SIZE = 5;

function unauthorized() {
  return NextResponse.json({ error: "관리자 인증이 필요합니다." }, { status: 401 });
}

function normalizeItems(body: Record<string, unknown>): BulkAcademyInput[] {
  if (Array.isArray(body.items)) {
    return body.items as BulkAcademyInput[];
  }
  if (Array.isArray(body.academies)) {
    return body.academies as BulkAcademyInput[];
  }
  if (body.name && body.address) {
    return [body as unknown as BulkAcademyInput];
  }
  return [];
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/admin/bulk-register",
    auth: "x-admin-secret 또는 Authorization: Bearer {ACADEMY_ADMIN_SECRET}",
    storage: isSupabaseConfigured() ? "supabase" : "r2-json",
    limits: { maxBatchSize: MAX_BATCH_SIZE },
    options: {
      refine_with_gemini: "GEMINI_API_KEY 설정 시 소개글 자동 재작성",
      skip_image_mirror: "true면 image_urls 미러링 생략 (이미 R2 URL만 전달할 때)",
    },
    example: {
      refine_with_gemini: true,
      items: [
        {
          name: "OO애견미용학원",
          address: "경기도 부천시 원미구 ...",
          phone: "032-000-0000",
          description: "네이버 플레이스에서 수집한 원본 소개글...",
          image_urls: [
            "https://search.pstatic.net/sunny/?src=...",
          ],
          naver_place_url: "https://map.naver.com/p/...",
        },
      ],
    },
  });
}

export async function POST(request: Request) {
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
    const body = (await request.json()) as Record<string, unknown>;
    const items = normalizeItems(body);

    if (items.length === 0) {
      return NextResponse.json(
        { error: "items 배열 또는 단일 학원 객체(name, address)가 필요합니다." },
        { status: 400 }
      );
    }

    if (items.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { error: `한 번에 최대 ${MAX_BATCH_SIZE}건까지 등록할 수 있습니다.` },
        { status: 400 }
      );
    }

    const options = {
      refineWithGemini: body.refine_with_gemini === true,
      skipImageMirror: body.skip_image_mirror === true,
    };

    if (items.length === 1) {
      const result = await bulkRegisterAcademy(items[0], options);
      return NextResponse.json(result, { status: result.ok ? 200 : 422 });
    }

    const batch = await bulkRegisterAcademies(items, options);
    return NextResponse.json(batch, {
      status: batch.failed === batch.total ? 422 : 200,
    });
  } catch (error) {
    console.error("bulk-register 오류:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
