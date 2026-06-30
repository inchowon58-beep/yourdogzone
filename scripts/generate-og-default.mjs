import sharp from "sharp";

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop stop-color="#312E81"/>
      <stop offset="0.55" stop-color="#4F46E5"/>
      <stop offset="1" stop-color="#6366F1"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <text x="80" y="150" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="32" font-weight="700">유아독존</text>
  <text x="80" y="260" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="56" font-weight="800">반려견과 함께하는 모든 정보</text>
  <text x="80" y="340" fill="#E0E7FF" font-family="Arial, sans-serif" font-size="28">애견미용학원, 분양, 보호소, 병원, 견종소개</text>
</svg>`;

sharp(Buffer.from(svg))
  .png()
  .toFile("public/og-default.png")
  .then(() => console.log("created public/og-default.png"))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
