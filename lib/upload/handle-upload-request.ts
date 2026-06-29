import { NextResponse } from "next/server";
import {
  MAX_IMAGE_SIZE_BYTES,
  resolveImageContentType,
} from "@/lib/upload/constants";
import { uploadBufferToR2 } from "@/lib/upload/r2-upload";
import {
  getMissingR2EnvVars,
  getR2Config,
  getPublicBaseUrl,
} from "@/lib/upload/r2-server";

export async function handleUploadPost(request: Request) {
  try {
    const missing = getMissingR2EnvVars();
    if (missing.length > 0 || !getR2Config()) {
      return NextResponse.json(
        {
          error: `R2 환경 변수 누락: ${missing.join(", ")}`,
          missing,
        },
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

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const result = await uploadBufferToR2(buffer, file.name, contentType);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      publicUrl: result.publicUrl,
      key: result.key,
    });
  } catch (error) {
    console.error("업로드 API 실패:", error);
    const message =
      error instanceof Error ? error.message : "알 수 없는 오류";
    return NextResponse.json(
      { error: `업로드 처리 중 오류: ${message}` },
      { status: 500 }
    );
  }
}

export async function handleUploadGet() {
  const missing = getMissingR2EnvVars();
  const config = getR2Config();

  return NextResponse.json({
    ready: missing.length === 0 && Boolean(config),
    missing,
    bucket: config?.bucket ?? null,
    endpoint: config?.endpoint ?? null,
    publicBase: getPublicBaseUrl(),
  });
}
