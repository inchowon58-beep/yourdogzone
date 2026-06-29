import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  buildR2Key,
  MAX_IMAGE_SIZE_BYTES,
  resolveImageContentType,
} from "@/lib/upload/constants";
import { createR2S3Client, getR2Config } from "@/lib/upload/r2-server";

export async function POST(request: Request) {
  try {
    const config = getR2Config();
    if (!config) {
      return NextResponse.json(
        { error: "R2 환경 변수가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const filename = body.filename as string | undefined;
    const requestedContentType = body.contentType as string | undefined;
    const fileSize = body.fileSize as number | undefined;

    if (!filename?.trim()) {
      return NextResponse.json(
        { error: "filename이 필요합니다." },
        { status: 400 }
      );
    }

    const contentType = resolveImageContentType(filename, requestedContentType);
    if (!contentType) {
      return NextResponse.json(
        { error: "지원하지 않는 이미지 형식입니다. (JPEG, PNG, WebP, GIF)" },
        { status: 400 }
      );
    }

    if (fileSize && fileSize > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "파일 크기는 10MB 이하여야 합니다." },
        { status: 400 }
      );
    }

    const key = buildR2Key(filename);
    const s3Client = createR2S3Client(config);

    const command = new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 60,
      signableHeaders: new Set(["content-type"]),
      unhoistableHeaders: new Set(["content-type"]),
    });

    const publicUrl = `${config.publicBase}/${key}`;

    return NextResponse.json({
      uploadUrl,
      publicUrl,
      key,
      contentType,
    });
  } catch (error) {
    console.error("R2 Presigned URL 생성 실패:", error);
    return NextResponse.json(
      { error: "Upload preparation failed" },
      { status: 500 }
    );
  }
}
