import { NextResponse } from "next/server";
import { MAX_IMAGE_SIZE_BYTES, resolveImageContentType } from "@/lib/upload/constants";
import { uploadBufferToR2 } from "@/lib/upload/r2-upload";
import { getR2Config } from "@/lib/upload/r2-server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!getR2Config()) {
      return NextResponse.json(
        { error: "R2 환경 변수가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "업로드할 파일이 없습니다." },
        { status: 400 }
      );
    }

    const contentType = resolveImageContentType(file.name, file.type);
    if (!contentType) {
      return NextResponse.json(
        { error: "지원하지 않는 이미지 형식입니다. (JPEG, PNG, WebP, GIF)" },
        { status: 400 }
      );
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "파일 크기는 10MB 이하여야 합니다." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadBufferToR2(buffer, file.name, contentType);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      publicUrl: result.publicUrl,
      key: result.key,
    });
  } catch (error) {
    console.error("직접 업로드 API 실패:", error);
    return NextResponse.json(
      { error: "업로드 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
