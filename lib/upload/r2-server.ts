import { S3Client } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import https from "node:https";

const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
  rejectUnauthorized: true,
  minVersion: "TLSv1.2",
});

export type R2Config = {
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
  bucket: string;
  publicBase: string;
};

const DEFAULT_PUBLIC_BASE = "https://img.yourdogzone.co.kr";

function trimEnv(value: string | undefined): string {
  return value?.trim() ?? "";
}

export function normalizeR2Endpoint(endpoint: string, bucket: string): string {
  let normalized = endpoint.trim().replace(/\/+$/, "");

  if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
    normalized = `https://${normalized}`;
  }

  try {
    const url = new URL(normalized);

    if (url.hostname.startsWith(`${bucket}.`)) {
      url.hostname = url.hostname.slice(bucket.length + 1);
    }

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

export function getPublicBaseUrl(): string {
  const fromEnv =
    trimEnv(process.env.NEXT_PUBLIC_R2_PUBLIC_URL) ||
    trimEnv(process.env.NEXT_PUBLIC_S3_PUBLIC_URL);

  return (fromEnv || DEFAULT_PUBLIC_BASE).replace(/\/$/, "");
}

export function getMissingR2EnvVars(): string[] {
  const missing: string[] = [];
  if (!trimEnv(process.env.R2_ACCESS_KEY_ID)) missing.push("R2_ACCESS_KEY_ID");
  if (!trimEnv(process.env.R2_SECRET_ACCESS_KEY))
    missing.push("R2_SECRET_ACCESS_KEY");
  if (!trimEnv(process.env.R2_ENDPOINT)) missing.push("R2_ENDPOINT");
  if (!trimEnv(process.env.R2_BUCKET_NAME)) missing.push("R2_BUCKET_NAME");
  return missing;
}

export function getR2Config(): R2Config | null {
  const accessKeyId = trimEnv(process.env.R2_ACCESS_KEY_ID);
  const secretAccessKey = trimEnv(process.env.R2_SECRET_ACCESS_KEY);
  const rawEndpoint = trimEnv(process.env.R2_ENDPOINT);
  const bucket = trimEnv(process.env.R2_BUCKET_NAME);

  if (!accessKeyId || !secretAccessKey || !rawEndpoint || !bucket) {
    return null;
  }

  return {
    accessKeyId,
    secretAccessKey,
    endpoint: normalizeR2Endpoint(rawEndpoint, bucket),
    bucket,
    publicBase: getPublicBaseUrl(),
  };
}

export function extractR2AccountId(endpoint: string): string | null {
  const match = endpoint.match(
    /https?:\/\/([a-f0-9]{32})\.r2\.cloudflarestorage\.com/i
  );
  return match?.[1] ?? null;
}

export function createR2S3Client(
  config: Pick<R2Config, "accessKeyId" | "secretAccessKey" | "endpoint">
) {
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
