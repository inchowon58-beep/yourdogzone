import "server-only";

import sharp from "sharp";
import {
  buildOgImageSvg,
  escapeOgXml,
  wrapOgCenteredLines,
} from "@/lib/seo/og-image-shared";

export {
  ACADEMY_OG_SUBTITLE,
  OG_BRAND_LINE,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  buildCategoryOgSubtitle,
  buildOgImageSvg,
} from "@/lib/seo/og-image-shared";

export async function renderOgImagePng(subtitle: string): Promise<Buffer> {
  const svg = buildOgImageSvg(subtitle);
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/** CDN 사진 + 키워드 오버레이 OG (화이트파크 상단 썸네일형, 1200×1200) */
export async function renderPhotoHeroOgPng(input: {
  backgroundUrl: string;
  badge: string;
  title: string;
  line2: string;
  bar: string;
}): Promise<Buffer> {
  const size = 1200;
  const res = await fetch(input.backgroundUrl, {
    signal: AbortSignal.timeout(12_000),
    headers: { Accept: "image/*" },
  });
  if (!res.ok) {
    throw new Error(`배경 이미지 로드 실패 HTTP ${res.status}`);
  }
  const bgBuf = Buffer.from(await res.arrayBuffer());
  const resized = await sharp(bgBuf)
    .rotate()
    .resize(size, size, { fit: "cover", position: "centre" })
    .jpeg({ quality: 88 })
    .toBuffer();

  const titleLines = wrapOgCenteredLines(input.title, 14, 2).map(escapeOgXml);
  const titleStartY = titleLines.length > 1 ? 520 : 560;
  const titleBlock = titleLines
    .map((line, i) => {
      const y = titleStartY + i * 78;
      return `<text x="600" y="${y}" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="72" font-weight="700">${line}</text>`;
    })
    .join("\n  ");

  const line2 = escapeOgXml(input.line2.trim() || "");
  const badge = escapeOgXml(input.badge.trim() || "유아독존");
  const bar = escapeOgXml(input.bar.trim() || "");

  const overlay = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#0f172a" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0.55"/>
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#vignette)"/>
  <rect x="36" y="36" width="1128" height="1128" rx="28" fill="none" stroke="#FFFFFF" stroke-opacity="0.9" stroke-width="3"/>
  <rect x="390" y="210" width="420" height="56" rx="28" fill="#0f766e"/>
  <text x="600" y="248" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="28" font-weight="700">${badge}</text>
  ${titleBlock}
  <text x="600" y="${titleStartY + titleLines.length * 78}" text-anchor="middle" fill="#CCFBF1" font-family="Arial, sans-serif" font-size="56" font-weight="700">${line2}</text>
  <rect x="220" y="900" width="760" height="72" rx="36" fill="#000000" fill-opacity="0.55"/>
  <text x="600" y="946" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="30" font-weight="600">${bar}</text>
</svg>`;

  return sharp(resized)
    .composite([{ input: Buffer.from(overlay), top: 0, left: 0 }])
    .png()
    .toBuffer();
}
