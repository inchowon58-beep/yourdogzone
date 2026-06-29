import { S3Client } from "@aws-sdk/client-s3";

export type R2Config = {
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
  bucket: string;
  publicBase: string;
};

/**
 * R2 endpoint에서 버킷명이 path/virtual-host 형태로 중복 포함된 경우 제거합니다.
 * 최종 형태: https://{account_id}.r2.cloudflarestorage.com
 */
export function normalizeR2Endpoint(endpoint: string, bucket: string): string {
  let normalized = endpoint.trim().replace(/\/+$/, "");

  if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
    normalized = `https://${normalized}`;
  }

  try {
    const url = new URL(normalized);

    // virtual-hosted: yourdogzoneig.7dfbf8fcf32d20d4f3bfa6dce0668b20.r2.cloudflarestorage.com
    if (url.hostname.startsWith(`${bucket}.`)) {
      url.hostname = url.hostname.slice(bucket.length + 1);
    }

    // path-style: .../yourdogzoneig
    const pathSegments = url.pathname.split("/").filter(Boolean);
    if (pathSegments.length > 0 && pathSegments[pathSegments.length - 1] === bucket) {
      pathSegments.pop();
      url.pathname = pathSegments.length ? `/${pathSegments.join("/")}` : "";
    }

    return url.toString().replace(/\/$/, "");
  } catch {
    return normalized
      .replace(new RegExp(`/${bucket}/?$`), "")
      .replace(new RegExp(`//${bucket}\\.`, "i"), "//");
  }
}

export function getR2Config(): R2Config | null {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const rawEndpoint = process.env.R2_ENDPOINT;
  const bucket = process.env.R2_BUCKET_NAME;
  const publicBase =
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL ??
    process.env.NEXT_PUBLIC_S3_PUBLIC_URL;

  if (!accessKeyId || !secretAccessKey || !rawEndpoint || !bucket || !publicBase) {
    return null;
  }

  return {
    accessKeyId,
    secretAccessKey,
    endpoint: normalizeR2Endpoint(rawEndpoint, bucket),
    bucket,
    publicBase: publicBase.replace(/\/$/, ""),
  };
}

export function createR2S3Client(config: Pick<R2Config, "accessKeyId" | "secretAccessKey" | "endpoint">) {
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
  });
}
