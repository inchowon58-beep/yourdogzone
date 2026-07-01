import type { Metadata } from "next";
import { Suspense } from "react";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { MainAdminLoginForm } from "@/components/admin/MainAdminLoginForm";

export const metadata: Metadata = buildPageMetadata({
  title: "메인 관리자 로그인",
  description: "유아독존 메인 관리자",
  path: "/admin/login",
  noIndex: true,
});

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-bold">메인 관리자</h1>
        <p className="mt-2 text-sm text-muted">
          지역 SEO 페이지 · 서비스 통합 관리
        </p>
        <div className="mt-8">
          <Suspense fallback={null}>
            <MainAdminLoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
