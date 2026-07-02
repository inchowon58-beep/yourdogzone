import "server-only";

import sharp from "sharp";

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

export const OG_BRAND_LINE = "반려동물포털 유아독존";
export const ACADEMY_OG_SUBTITLE = "애견미용학원 정보";

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapSubtitleLines(subtitle: string, maxChars = 18): string[] {
  const trimmed = subtitle.trim();
  if (trimmed.length <= maxChars) return [trimmed];

  const words = trimmed.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 2);
}

/** 1200×630 OG — 학원 분위기 배경 + 보라 오버레이 + 브랜드 텍스트 */
export function buildOgImageSvg(subtitle: string): string {
  const safeSubtitle = escapeXml(subtitle.trim() || "정보");
  const subtitleLines = wrapSubtitleLines(safeSubtitle).map(escapeXml);
  const subtitleY = subtitleLines.length > 1 ? 360 : 390;
  const subtitleBlock = subtitleLines
    .map((line, i) => {
      const y = subtitleY + i * 58;
      return `<text x="80" y="${y}" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="48" font-weight="700">${line}</text>`;
    })
    .join("\n  ");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${OG_IMAGE_WIDTH}" height="${OG_IMAGE_HEIGHT}" viewBox="0 0 ${OG_IMAGE_WIDTH} ${OG_IMAGE_HEIGHT}">
  <defs>
    <linearGradient id="salonBg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop stop-color="#F5F0E8"/>
      <stop offset="0.45" stop-color="#E8DDD0"/>
      <stop offset="1" stop-color="#D4C4B0"/>
    </linearGradient>
    <linearGradient id="purpleVeil" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop stop-color="#312E81" stop-opacity="0.82"/>
      <stop offset="0.55" stop-color="#4F46E5" stop-opacity="0.78"/>
      <stop offset="1" stop-color="#6366F1" stop-opacity="0.85"/>
    </linearGradient>
    <pattern id="pawPattern" width="120" height="120" patternUnits="userSpaceOnUse">
      <circle cx="30" cy="30" r="8" fill="#7C6A55" fill-opacity="0.08"/>
      <circle cx="50" cy="22" r="5" fill="#7C6A55" fill-opacity="0.07"/>
      <circle cx="18" cy="22" r="5" fill="#7C6A55" fill-opacity="0.07"/>
      <circle cx="40" cy="42" r="5" fill="#7C6A55" fill-opacity="0.07"/>
      <circle cx="22" cy="42" r="5" fill="#7C6A55" fill-opacity="0.07"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="url(#salonBg)"/>
  <rect width="1200" height="630" fill="url(#pawPattern)"/>
  <g opacity="0.12" fill="none" stroke="#5B4D3E" stroke-width="3">
    <rect x="720" y="80" width="380" height="470" rx="24"/>
    <path d="M860 180 h120 M920 120 v120"/>
    <circle cx="1020" cy="420" r="36"/>
    <path d="M1000 400 q20 30 40 0"/>
  </g>
  <rect width="1200" height="630" fill="url(#purpleVeil)"/>
  <text x="80" y="150" fill="#E0E7FF" font-family="Arial, sans-serif" font-size="34" font-weight="600">${escapeXml(OG_BRAND_LINE)}</text>
  ${subtitleBlock}
  <text x="80" y="560" fill="#C7D2FE" font-family="Arial, sans-serif" font-size="24" font-weight="500">yourdogzone.co.kr</text>
</svg>`;
}

export async function renderOgImagePng(subtitle: string): Promise<Buffer> {
  const svg = buildOgImageSvg(subtitle);
  return sharp(Buffer.from(svg)).png().toBuffer();
}

export function buildCategoryOgSubtitle(categoryTitle: string): string {
  const trimmed = categoryTitle.trim();
  if (!trimmed) return "정보";
  return trimmed.endsWith("정보") ? trimmed : `${trimmed} 정보`;
}
