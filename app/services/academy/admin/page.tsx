import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AcademyAdminPanel } from "@/components/academy/AcademyAdminPanel";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "학원 관리",
  description: "애견미용학원 관리자 페이지",
  path: "/services/academy/admin",
  noIndex: true,
});

export default function AcademyAdminPage() {
  return (
    <main className="w-full min-w-0 max-w-4xl px-4 py-8 sm:px-6 sm:py-10 md:py-14">
      <Link
        href="/services/academy"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        학원 목록으로
      </Link>
      <AcademyAdminPanel />
    </main>
  );
}
