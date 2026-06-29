import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site/config";
import "./globals.css";

export const metadata: Metadata = {
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
  ],
  alternates: {
    types: {
      "application/rss+xml": [
        { url: "/feed.xml", title: `${SITE_NAME} RSS` },
      ],
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body className="flex min-h-full flex-col antialiased">
        <Header />
        <div className="flex flex-1 flex-col">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
