import { mkdir, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function buildFaviconSvg(size) {
  const r = Math.round(size * 0.22);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="#4F46E5"/>
  <g fill="#FFFFFF">
    <ellipse cx="${size * 0.5}" cy="${size * 0.62}" rx="${size * 0.16}" ry="${size * 0.13}"/>
    <circle cx="${size * 0.32}" cy="${size * 0.38}" r="${size * 0.08}"/>
    <circle cx="${size * 0.5}" cy="${size * 0.3}" r="${size * 0.08}"/>
    <circle cx="${size * 0.68}" cy="${size * 0.38}" r="${size * 0.08}"/>
    <circle cx="${size * 0.24}" cy="${size * 0.5}" r="${size * 0.065}"/>
    <circle cx="${size * 0.76}" cy="${size * 0.5}" r="${size * 0.065}"/>
  </g>
</svg>`;
}

/** 단일 PNG를 ICO 컨테이너(32bpp)로 래핑 — 외부 패키지 없이 favicon.ico 생성 */
function pngToIco(pngBuffer) {
  const pngOffset = 6 + 16;
  const size = pngBuffer.length;
  const out = Buffer.alloc(pngOffset + size);

  out.writeUInt16LE(0, 0);
  out.writeUInt16LE(1, 2);
  out.writeUInt16LE(1, 4);

  out.writeUInt8(32, 6);
  out.writeUInt8(32, 7);
  out.writeUInt8(0, 8);
  out.writeUInt8(0, 9);
  out.writeUInt16LE(1, 10);
  out.writeUInt16LE(32, 12);
  out.writeUInt32LE(size, 14);
  out.writeUInt32LE(pngOffset, 18);

  pngBuffer.copy(out, pngOffset);
  return out;
}

async function writePng(svg, size, filePath) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(filePath);
}

async function main() {
  const targets = [
    { size: 32, rel: "app/icon.png" },
    { size: 32, rel: "public/icon.png" },
    { size: 180, rel: "app/apple-icon.png" },
    { size: 180, rel: "public/apple-icon.png" },
  ];

  for (const { size, rel } of targets) {
    const filePath = path.join(root, rel);
    await writePng(buildFaviconSvg(size), size, filePath);
    console.log("created", rel);
  }

  const png32 = await sharp(Buffer.from(buildFaviconSvg(32)))
    .resize(32, 32)
    .png()
    .toBuffer();
  const ico = pngToIco(png32);

  for (const rel of ["app/favicon.ico", "public/favicon.ico"]) {
    const filePath = path.join(root, rel);
    await writeFile(filePath, ico);
    console.log("created", rel);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
