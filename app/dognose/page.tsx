import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "견종소개",
  description: "견종 딕셔너리 및 가이드",
};

export default function DognosePage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
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
