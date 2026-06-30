import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BreedRegisterForm } from "@/components/breed/BreedRegisterForm";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "견종 정보 등록",
  description: "견종 상세 정보를 등록하면 고유 URL 페이지가 생성됩니다.",
  path: "/dognose/register",
  noIndex: true,
});

export default function BreedRegisterPage() {
  return (
    <main className="w-full min-w-0 max-w-2xl px-4 py-8 sm:px-6 sm:py-10 md:py-14">
      <Link
        href="/dognose"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        견종 목록
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold md:text-3xl">견종 정보 등록</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          텍스트 정보를 입력하면 견종 상세 페이지가 생성됩니다. 사진은 선택 사항이며
          관리 페이지에서도 추가·수정할 수 있습니다.
        </p>
      </div>

      <BreedRegisterForm />
    </main>
  );
}
