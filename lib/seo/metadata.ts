import type { Metadata } from "next";
import { absoluteUrl, SITE_NAME } from "@/lib/site/config";
import { buildOgImageMetadata, resolveOgImageUrls } from "@/lib/seo/og-image";

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  images?: (string | null | undefined)[];
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
  imageAlt,
  noIndex = false,
  type = "website",
}: PageMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const ogImageAlt = imageAlt ?? title;
  const ogImages = buildOgImageMetadata(ogImageAlt, images);
  const ogImageUrls = resolveOgImageUrls(images);

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
      images: ogImages,
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
