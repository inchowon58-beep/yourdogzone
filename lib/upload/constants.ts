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

export function sanitizeFilename(filename: string): string {
  const base = filename.split(/[/\\]/).pop() ?? "image";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "image";
}

export function buildR2Key(filename: string): string {
  const safeName = sanitizeFilename(filename);
  return `academy/${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${safeName}`;
}
