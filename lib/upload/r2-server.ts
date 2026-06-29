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

const R2_HOST_PATTERN = /([a-f0-9]{32})\.r2\.cloudflarestorage\.com/i;

/** Vercel 값 칸에 `R2_ENDPOINT=https://...` 형태로 넣은 경우 등 복구 */
export function sanitizeRawR2Endpoint(raw: string): string {
  let value = raw.trim().replace(/^r2_endpoint\s*=\s*/i, "");

  const hostMatch = value.match(R2_HOST_PATTERN);
  if (hostMatch) {
    return `https://${hostMatch[1].toLowerCase()}.r2.cloudflarestorage.com`;
  }

  const accountOnly = value.match(/^([a-f0-9]{32})$/i);
  if (accountOnly) {
    return `https://${accountOnly[1].toLowerCase()}.r2.cloudflarestorage.com`;
  }

  return value;
}

export function isValidR2Endpoint(endpoint: string): boolean {
  return R2_HOST_PATTERN.test(endpoint);
}

export function normalizeR2Endpoint(endpoint: string, bucket: string): string {
  let normalized = sanitizeRawR2Endpoint(endpoint).replace(/\/+$/, "");

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

  const endpoint = normalizeR2Endpoint(rawEndpoint, bucket);
  if (!isValidR2Endpoint(endpoint)) {
    return null;
  }

  return {
    accessKeyId,
    secretAccessKey,
    endpoint,
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
