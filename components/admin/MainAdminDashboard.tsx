"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import type { AdminOverviewStats } from "@/lib/admin/service-links";
import { SERVICE_ADMIN_LINKS } from "@/lib/admin/service-links";
import { RegionalLandingAdminPanel } from "@/components/admin/RegionalLandingAdminPanel";
import { AdvisoryMembersAdminPanel } from "@/components/admin/AdvisoryMembersAdminPanel";

type Props = {
  stats: AdminOverviewStats;
  username: string;
};

export function MainAdminDashboard({ stats, username }: Props) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  function listingStat(id: string) {
    const s = stats.listings[id];
    if (!s) return "—";
    return `${s.total}건 (인증 ${s.premium})`;
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">메인 관리자</h1>
          <p className="mt-1 text-sm text-muted">
            {username} 님 · 서비스별 관리 및 지역 SEO 페이지
          </p>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm"
        >
          <LogOut className="h-4 w-4" />
          로그아웃
        </button>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-bold">서비스별 관리</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICE_ADMIN_LINKS.map((svc) => {
            let stat = "—";
            if (svc.id === "academy") {
              stat = `${stats.academy.total}건 (인증 ${stats.academy.premium})`;
            } else if (svc.id === "breeds") {
              stat = `${stats.breeds}건`;
            } else if (svc.id in stats.listings) {
              stat = listingStat(svc.id);
            }

            return (
              <div
                key={svc.id}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[var(--card-shadow)]"
              >
                <p className="font-semibold text-foreground">{svc.title}</p>
                <p className="mt-1 text-sm text-muted">등록 {stat}</p>
                <div className="mt-4 flex flex-wrap gap-3 text-sm">
                  <Link
                    href={svc.href}
                    className="font-medium text-primary hover:underline"
                  >
                    관리자 페이지 →
                  </Link>
                  <Link
                    href={svc.publicHref}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-muted hover:text-foreground"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    공개 목록
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-muted">
          각 서비스 관리자는 기존과 같이{" "}
          <code className="rounded bg-gray-100 px-1">ACADEMY_ADMIN_SECRET</code>{" "}
          으로 API 인증합니다. 메인 관리자 로그인과 별도입니다.
        </p>
      </section>

      <section className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 text-sm">
        <p className="font-medium text-foreground">지역 SEO 페이지 현황</p>
        <p className="mt-1 text-muted">
          전체 {stats.regionalPages.total}건 · 공개{" "}
          {stats.regionalPages.published}건
        </p>
      </section>

      <RegionalLandingAdminPanel />

      <AdvisoryMembersAdminPanel />
    </div>
  );
}
