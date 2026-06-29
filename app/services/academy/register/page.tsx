import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RegisterForm } from "@/components/academy/RegisterForm";

export const metadata: Metadata = {
  title: "학원 정보 등록",
  description: "애견미용학원 정보를 직접 등록하고 상세 페이지를 생성하세요.",
};

export default function AcademyRegisterPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10 md:py-14">
      <Link
        href="/services/academy"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        학원 목록
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold md:text-3xl">학원 정보 등록</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          학원 원장님이 직접 정보를 입력하면 고유 URL의 상세 페이지가 자동으로
          생성됩니다. 등록 후 검색엔진에 즉시 알림(IndexNow)이 전송됩니다.
        </p>
      </div>

      <RegisterForm />
    </main>
  );
}
