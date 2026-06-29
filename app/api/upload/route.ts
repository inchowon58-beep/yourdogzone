import { NextResponse } from "next/server";
import { createPresignedUpload } from "@/lib/upload/presign";
import {
  getMissingR2EnvVars,
  getPublicBaseUrl,
  getR2Config,
  isValidR2Endpoint,
  sanitizeRawR2Endpoint,
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
  const rawEndpoint = process.env.R2_ENDPOINT?.trim() ?? "";
  const sanitizedEndpoint = rawEndpoint
    ? sanitizeRawR2Endpoint(rawEndpoint)
    : null;

  return NextResponse.json({
    mode: "presigned-url",
    ready: missing.length === 0 && Boolean(config),
    missing,
    bucket: config?.bucket ?? null,
    endpoint: config?.endpoint ?? sanitizedEndpoint,
    endpointValid: config ? isValidR2Endpoint(config.endpoint) : false,
    endpointWarning:
      rawEndpoint && sanitizedEndpoint !== rawEndpoint
        ? "R2_ENDPOINT 값 형식이 잘못되어 자동 보정했습니다. Vercel에는 URL만 넣어 주세요."
        : null,
    publicBase: getPublicBaseUrl(),
  });
}
