import sharp from "sharp";

/** 상세 슬라이더 표시 기준 (2x 레티나 여유) */
export const ACADEMY_IMAGE_MAX_WIDTH = 1200;
export const ACADEMY_IMAGE_MAX_HEIGHT = 900;
export const ACADEMY_IMAGE_JPEG_QUALITY = 85;

export type ResizedImage = {
  buffer: Buffer;
  contentType: string;
  extension: string;
};

/** 비율 유지 리사이즈 후 JPEG로 저장 (용량 절감) */
export async function resizeAcademyImage(
  input: Buffer
): Promise<ResizedImage> {
  const meta = await sharp(input).metadata();
  const format = meta.format;

  if (format === "gif") {
    return { buffer: input, contentType: "image/gif", extension: ".gif" };
  }

  let pipeline = sharp(input).rotate();

  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (
    width > ACADEMY_IMAGE_MAX_WIDTH ||
    height > ACADEMY_IMAGE_MAX_HEIGHT
  ) {
    pipeline = pipeline.resize(
      ACADEMY_IMAGE_MAX_WIDTH,
      ACADEMY_IMAGE_MAX_HEIGHT,
      { fit: "inside", withoutEnlargement: true }
    );
  }

  const buffer = await pipeline
    .jpeg({ quality: ACADEMY_IMAGE_JPEG_QUALITY, mozjpeg: true })
    .toBuffer();

  return { buffer, contentType: "image/jpeg", extension: ".jpg" };
}
