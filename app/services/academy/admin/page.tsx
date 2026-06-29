import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AcademyAdminPanel } from "@/components/academy/AcademyAdminPanel";

export const metadata: Metadata = {
  title: "학원 관리",
  robots: { index: false, follow: false },
};

export default function AcademyAdminPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10 md:py-14">
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
