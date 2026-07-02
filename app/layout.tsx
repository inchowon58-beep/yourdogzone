import type { Metadata, Viewport } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getSiteUrl,
  SITE_DESCRIPTION,
  SITE_NAME,
} from "@/lib/site/config";
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from "@/lib/seo/site-jsonld";
import { getDefaultOgImageUrl } from "@/lib/seo/og-image";
import { getSiteIconsMetadata } from "@/lib/site/favicon";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${SITE_NAME} | 반려동물 통합 포털`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "반려견",
    "강아지",
    "애견미용학원",
    "강아지분양",
    "동물병원",
    "견종소개",
    "유아독존",
  ],
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": [
        { url: "/feed.xml", title: `${SITE_NAME} RSS` },
      ],
    },
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: SITE_NAME,
    title: `${SITE_NAME} | 반려동물 통합 포털`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: getDefaultOgImageUrl(),
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} | 반려동물 통합 포털`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: { index: true, follow: true },
  icons: getSiteIconsMetadata(),
  verification: {
    other: {
      "naver-site-verification": "4b76245dea128c61246f068d9449786517ecd73d",
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#4f46e5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full w-full overflow-x-hidden">
      <body className="flex min-h-full w-full flex-col overflow-x-hidden antialiased">
        <JsonLd data={[buildWebSiteJsonLd(), buildOrganizationJsonLd()]} />
        <Header />
        <div className="flex w-full min-w-0 max-w-full flex-1 flex-col items-center overflow-x-hidden">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
