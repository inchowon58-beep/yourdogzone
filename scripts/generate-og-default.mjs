import sharp from "sharp";

const OG_BRAND_LINE = "반려동물포털 유아독존";
const subtitle = process.argv[2]?.trim() || "애견미용학원 정보";
const out = process.argv[3]?.trim() || "public/og-default.png";

function escapeXml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const safeSubtitle = escapeXml(subtitle);

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
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
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="url(#salonBg)"/>
  <rect width="1200" height="630" fill="url(#pawPattern)"/>
  <rect width="1200" height="630" fill="url(#purpleVeil)"/>
  <text x="80" y="150" fill="#E0E7FF" font-family="Arial, sans-serif" font-size="34" font-weight="600">${escapeXml(OG_BRAND_LINE)}</text>
  <text x="80" y="390" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="48" font-weight="700">${safeSubtitle}</text>
  <text x="80" y="560" fill="#C7D2FE" font-family="Arial, sans-serif" font-size="24" font-weight="500">yourdogzone.co.kr</text>
</svg>`;

sharp(Buffer.from(svg))
  .png()
  .toFile(out)
  .then(() => console.log(`created ${out} (${subtitle})`))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
