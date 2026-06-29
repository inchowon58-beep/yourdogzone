import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "유아독존 | 반려동물 통합 포털",
    template: "%s | 유아독존",
  },
  description:
    "애견미용학원, 강아지분양, 보호소, 장례식장, 브리더, 견종소개, 동물병원, Q&A까지 — 반려견 생활의 모든 것을 한곳에서.",
  keywords: [
    "반려견",
    "강아지",
    "애견미용학원",
    "강아지분양",
    "동물병원",
    "견종소개",
  ],
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
