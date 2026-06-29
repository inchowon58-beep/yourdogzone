import { NextRequest, NextResponse } from "next/server";
import { getAcademySlugs } from "@/lib/academy/queries";
import { academyPageUrl, submitToIndexNow } from "@/lib/indexnow/submit";
import { absoluteUrl } from "@/lib/site/config";

export async function POST(request: NextRequest) {
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

    const result = await submitToIndexNow(urls);

    return NextResponse.json({
      ...result,
      submitted: urls.length,
      urls,
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
        slug: "단일 학원 slug로 IndexNow 전송",
        urls: "URL 배열로 IndexNow 전송",
        allAcademies: "true — 전체 academy_list slug 일괄 전송",
      },
    },
  });
}
