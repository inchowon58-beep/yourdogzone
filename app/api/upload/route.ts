import { NextResponse } from "next/server";
import { createPresignedUpload } from "@/lib/upload/presign";
import {
  getMissingR2EnvVars,
  getPublicBaseUrl,
  getR2Config,
} from "@/lib/upload/r2-server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const filename = body.filename as string | undefined;
    const contentType = body.contentType as string | undefined;
    const fileSize = body.fileSize as number | undefined;

    if (!filename?.trim()) {
      return NextResponse.json(
        { error: "filename이 필요합니다." },
        { status: 400 }
      );
    }

    const result = await createPresignedUpload(
      filename,
      contentType,
      fileSize
    );

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({
      uploadUrl: result.uploadUrl,
      publicUrl: result.publicUrl,
      key: result.key,
      contentType: result.contentType,
    });
  } catch (error) {
    console.error("R2 Presigned URL 생성 실패:", error);
    return NextResponse.json(
      { error: "Upload preparation failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const missing = getMissingR2EnvVars();
  const config = getR2Config();

  return NextResponse.json({
    mode: "presigned-url",
    ready: missing.length === 0 && Boolean(config),
    missing,
    bucket: config?.bucket ?? null,
    endpoint: config?.endpoint ?? null,
    publicBase: getPublicBaseUrl(),
  });
}
