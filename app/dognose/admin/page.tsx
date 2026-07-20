import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BreedAdminPanel } from "@/components/breed/BreedAdminPanel";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "견종 관리",
  description: "견종 데이터 관리자 페이지",
  path: "/dognose/admin",
  noIndex: true,
});

export default function BreedAdminPage() {
  return (
    <main className="w-full min-w-0 px-4 py-8 sm:px-6 sm:py-10 md:py-14">
      <Link
        href="/dognose"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        견종 목록으로
      </Link>
      <BreedAdminPanel />
    </main>
  );
}
