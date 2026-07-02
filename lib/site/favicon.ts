/** 배포 후 파비콘 캐시 무효화용 — 브랜드 파비콘 교체 시 증가 */
export const FAVICON_VERSION = "20260702";

export const SITE_FAVICON_PATHS = {
  ico: "/favicon.ico",
  png32: "/icon.png",
  apple: "/apple-icon.png",
} as const;

function withVersion(path: string): string {
  return `${path}?v=${FAVICON_VERSION}`;
}

export function getSiteIconsMetadata() {
  return {
    icon: [
      {
        url: withVersion(SITE_FAVICON_PATHS.ico),
        sizes: "48x48",
        type: "image/x-icon",
      },
      {
        url: withVersion(SITE_FAVICON_PATHS.png32),
        sizes: "32x32",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: withVersion(SITE_FAVICON_PATHS.apple),
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcut: withVersion(SITE_FAVICON_PATHS.ico),
  };
}
