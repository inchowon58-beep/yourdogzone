import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import https from "node:https";
import {
  buildR2Key,
  MAX_IMAGE_SIZE_BYTES,
  resolveImageContentType,
} from "@/lib/upload/constants";
import { getMissingR2EnvVars, getR2Config } from "@/lib/upload/r2-server";

const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
  rejectUnauthorized: true,
  minVersion: "TLSv1.2",
});

function createPresignS3Client() {
  const config = getR2Config();
  if (!config) return null;

  return new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: true,
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    requestHandler: new NodeHttpHandler({
      httpsAgent,
      connectionTimeout: 5_000,
      requestTimeout: 5_000,
    }),
  });
}

export type PresignResult =
  | {
      uploadUrl: string;
      publicUrl: string;
      key: string;
      contentType: string;
    }
  | { error: string; status: number };

export async function createPresignedUpload(
  filename: string,
  requestedContentType?: string,
  fileSize?: number
): Promise<PresignResult> {
  const missing = getMissingR2EnvVars();
  const config = getR2Config();

  if (missing.length > 0 || !config) {
    return {
      error: `R2 환경 변수 누락: ${missing.join(", ")}`,
      status: 500,
    };
  }

  const contentType = resolveImageContentType(filename, requestedContentType);
  if (!contentType) {
    return {
      error: "지원하지 않는 이미지 형식입니다. (JPEG, PNG, WebP, GIF)",
      status: 400,
    };
  }

  if (fileSize && fileSize > MAX_IMAGE_SIZE_BYTES) {
    return {
      error: "파일 크기는 10MB 이하여야 합니다.",
      status: 400,
    };
  }

  const s3Client = createPresignS3Client();
  if (!s3Client) {
    return { error: "R2 클라이언트를 생성할 수 없습니다.", status: 500 };
  }

  const key = buildR2Key(filename);

  try {
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

    return {
      uploadUrl,
      publicUrl: `${config.publicBase}/${key}`,
      key,
      contentType,
    };
  } catch (error) {
    console.error("R2 Presigned URL 생성 실패:", error);
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    return { error: `Upload preparation failed: ${message}`, status: 500 };
  } finally {
    s3Client.destroy();
  }
}
