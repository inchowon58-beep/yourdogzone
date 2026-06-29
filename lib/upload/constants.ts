export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export function isAllowedImageType(contentType: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(
    contentType as (typeof ALLOWED_IMAGE_TYPES)[number]
  );
}

const EXT_TO_MIME: Record<string, (typeof ALLOWED_IMAGE_TYPES)[number]> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export function resolveImageContentType(
  filename: string,
  contentType?: string
): string | null {
  if (contentType && isAllowedImageType(contentType)) {
    return contentType;
  }

  const ext = filename.split(".").pop()?.toLowerCase();
  if (!ext) return null;

  const resolved = EXT_TO_MIME[ext];
  return resolved ?? null;
}

export function sanitizeFilename(filename: string): string {
  const base = filename.split(/[/\\]/).pop() ?? "image";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "image";
}

export function buildR2Key(filename: string): string {
  const safeName = sanitizeFilename(filename);
  return `academy/${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${safeName}`;
}
