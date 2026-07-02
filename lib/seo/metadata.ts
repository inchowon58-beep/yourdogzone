import type { Metadata } from "next";
import { absoluteUrl, SITE_NAME } from "@/lib/site/config";
import { buildOgImageMetadata, resolveOgImageUrls } from "@/lib/seo/og-image";
import { OG_BRAND_LINE } from "@/lib/seo/og-image-render";

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  images?: (string | null | undefined)[];
  /** 브랜드 OG 자동 생성용 부제 (예: 애견미용학원 정보, 강아지분양 정보) */
  ogSubtitle?: string;
  imageAlt?: string;
  noIndex?: boolean;
  type?: "website" | "article";
};

export function buildPageMetadata({
  title,
  description,
  path,
  keywords,
  images,
  ogSubtitle,
  imageAlt,
  noIndex = false,
  type = "website",
}: PageMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const ogImageAlt = imageAlt ?? title;
  const ogOptions = { images, ogSubtitle };
  const ogImages = buildOgImageMetadata(ogImageAlt, ogOptions);
  const ogImageUrls = resolveOgImageUrls(ogOptions);
  const brandedAlt = ogSubtitle
    ? `${OG_BRAND_LINE} · ${ogSubtitle}`
    : ogImageAlt;

  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      locale: "ko_KR",
      type,
      siteName: SITE_NAME,
      images: ogImages.map((img) => ({
        ...img,
        alt: brandedAlt,
      })),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImageUrls,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}
