import { NextRequest, NextResponse } from "next/server";
import { isAdminConfigured, verifyAdminSecret } from "@/lib/academy/admin-auth";
import { getAcademySlugs } from "@/lib/academy/queries";
import { academyPageUrl, submitToIndexNow } from "@/lib/indexnow/submit";
import { absoluteUrl } from "@/lib/site/config";

function unauthorized() {
  return NextResponse.json({ error: "관리자 인증이 필요합니다." }, { status: 401 });
}

export async function POST(request: NextRequest) {
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
    let urls: string[] = body.urls ?? [];

    if (body.allAcademies) {
      const slugs = await getAcademySlugs();
      urls = slugs.map((slug) => academyPageUrl(slug));
    }

    if (body.slug) {
      urls = [academyPageUrl(body.slug)];
    }

    if (urls.length === 0) {
      return NextResponse.json(
        { error: "urls, slug, 또는 allAcademies 파라미터가 필요합니다." },
        { status: 400 }
      );
    }

    const uniqueUrls = [...new Set(urls.filter((u) => typeof u === "string" && u.startsWith("http")))];
    const result = await submitToIndexNow(uniqueUrls);

    return NextResponse.json({
      ...result,
      submitted: uniqueUrls.length,
      urls: uniqueUrls,
    });
  } catch {
    return NextResponse.json(
      { error: "IndexNow 전송 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function GET() {
  const key = process.env.INDEXNOW_KEY;
  return NextResponse.json({
    enabled: Boolean(key),
    keyLocation: key ? absoluteUrl("/api/indexnow/key-file") : null,
    usage: {
      post: {
        auth: "x-admin-secret 또는 Authorization: Bearer {ACADEMY_ADMIN_SECRET}",
        urls: "URL 배열 일괄 IndexNow 전송 (크롤러 세션 종료 시)",
        slug: "단일 학원 slug로 IndexNow 전송",
        allAcademies: "true — 전체 academy slug 일괄 전송",
      },
    },
  });
}
