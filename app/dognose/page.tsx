import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "견종소개",
  description:
    "인기 견종별 특성, 성격, 털 관리, 미용 주기 등 반려견 견종 정보 가이드.",
  path: "/dognose",
  keywords: ["견종소개", "견종 정보", "강아지 종류", "반려견 견종"],
});

export default function DognosePage() {
  return (
    <main className="w-full min-w-0 max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        홈으로
      </Link>
      <h1 className="text-2xl font-bold">견종소개</h1>
      <p className="mt-2 text-muted">견종 딕셔너리 및 가이드 — 준비 중입니다.</p>
    </main>
  );
}
