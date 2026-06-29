import { NextResponse } from "next/server";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  buildR2Key,
  isAllowedImageType,
  MAX_IMAGE_SIZE_BYTES,
} from "@/lib/upload/constants";

function getR2Config() {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const endpoint = process.env.R2_ENDPOINT;
  const bucket = process.env.R2_BUCKET_NAME;
  const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

  if (!accessKeyId || !secretAccessKey || !endpoint || !bucket || !publicBase) {
    return null;
  }

  return { accessKeyId, secretAccessKey, endpoint, bucket, publicBase };
}

function getS3Client(endpoint: string, accessKeyId: string, secretAccessKey: string) {
  return new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
}

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
    const contentType = body.contentType as string | undefined;
    const fileSize = body.fileSize as number | undefined;

    if (!filename?.trim() || !contentType?.trim()) {
      return NextResponse.json(
        { error: "filename과 contentType이 필요합니다." },
        { status: 400 }
      );
    }

    if (!isAllowedImageType(contentType)) {
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

    const uniqueFilename = buildR2Key(filename);

    const command = new PutObjectCommand({
      Bucket: config.bucket,
      Key: uniqueFilename,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(
      getS3Client(config.endpoint, config.accessKeyId, config.secretAccessKey),
      command,
      { expiresIn: 60 }
    );

    const publicBase = config.publicBase.replace(/\/$/, "");
    const publicUrl = `${publicBase}/${uniqueFilename}`;

    return NextResponse.json({ uploadUrl, publicUrl, key: uniqueFilename });
  } catch (error) {
    console.error("R2 Presigned URL 생성 실패:", error);
    return NextResponse.json(
      { error: "Upload preparation failed" },
      { status: 500 }
    );
  }
}
