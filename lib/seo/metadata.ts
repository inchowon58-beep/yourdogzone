import type { Metadata } from "next";
import { absoluteUrl, SITE_NAME } from "@/lib/site/config";

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  images?: string[];
  noIndex?: boolean;
  type?: "website" | "article";
};

export function buildPageMetadata({
  title,
  description,
  path,
  keywords,
  images,
  noIndex = false,
  type = "website",
}: PageMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const ogImages = images?.filter(Boolean).map((src) =>
    src.startsWith("http") ? src : absoluteUrl(src)
  );

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
      images: ogImages?.length
        ? ogImages.map((image) => ({ url: image, alt: title }))
        : undefined,
    },
    twitter: {
      card: ogImages?.length ? "summary_large_image" : "summary",
      title,
      description,
      images: ogImages,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}
