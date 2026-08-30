import type { NextConfig } from "next";
import path from "path";

const R2_PUBLIC_HOSTNAME = "img.yourdogzone.co.kr";

function getR2ImageRemotePatterns(): NonNullable<
  NextConfig["images"]
>["remotePatterns"] {
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
    {
      protocol: "https",
      hostname: R2_PUBLIC_HOSTNAME,
      pathname: "/**",
    },
  ];

  const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (!publicUrl) return patterns;

  try {
    const parsed = new URL(publicUrl);
    const hostname = parsed.hostname;
    const protocol = parsed.protocol.replace(":", "") as "https" | "http";

    if (hostname !== R2_PUBLIC_HOSTNAME) {
      patterns.push({
        protocol,
        hostname,
        pathname: "/**",
      });
    }
  } catch {
    // env URL 파싱 실패 시 기본 도메인만 사용
  }

  return patterns;
}

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  serverExternalPackages: ["sharp"],
  images: {
    // Vercel Image Optimization 비용 $0 — /_next/image 변환 비활성
    unoptimized: true,
    loader: "custom",
    loaderFile: "./image-loader.ts",
    remotePatterns: getR2ImageRemotePatterns(),
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
  async rewrites() {
    const key = process.env.INDEXNOW_KEY?.trim();
    if (!key) return [];
    return [
      {
        source: `/${key}.txt`,
        destination: "/api/indexnow/key-file",
      },
    ];
  },
};

export default nextConfig;
