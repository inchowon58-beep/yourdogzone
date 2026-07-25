"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { LISTING_CATEGORIES } from "@/lib/listings/config";
import type { AdminOverviewStats } from "@/lib/admin/service-links";
import {
  MAIN_ADMIN_SECTIONS,
  type MainAdminSectionId,
} from "@/lib/admin/service-links";
import { RegionalLandingAdminPanel } from "@/components/admin/RegionalLandingAdminPanel";
import { AdvisoryMembersAdminPanel } from "@/components/admin/AdvisoryMembersAdminPanel";
import { AcademyAdminPanel } from "@/components/academy/AcademyAdminPanel";
import { BreedAdminPanel } from "@/components/breed/BreedAdminPanel";
import { ListingAdminPanel } from "@/components/listing/ListingAdminPanel";
import { CareIntakeAdminPanel } from "@/components/care-matching/CareIntakeAdminPanel";
import { CareShelterPartnerAdminPanel } from "@/components/care-matching/CareShelterPartnerAdminPanel";
import type { ListingCategory } from "@/lib/types/listing";

type Props = {
  username: string;
};

function emptyStats(): AdminOverviewStats {
  return {
    academy: { total: 0, premium: 0 },
    regionalPages: { total: 0, published: 0 },
    listings: {},
    breeds: 0,
  };
}

function isListingCategory(id: string): id is ListingCategory {
  return (LISTING_CATEGORIES as readonly string[]).includes(id);
}

export function MainAdminDashboard({ username }: Props) {
  const router = useRouter();
  const [active, setActive] = useState<MainAdminSectionId | null>(null);
  const [stats, setStats] = useState<AdminOverviewStats>(emptyStats);
  const [statsLoading, setStatsLoading] = useState(true);

  const refreshStats = useCallback(async (showLoading = false) => {
    if (showLoading) setStatsLoading(true);
    try {
      const res = await fetch("/api/admin/overview", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.stats) {
        setStats(data.stats as AdminOverviewStats);
      }
    } catch {
      // 통계 없이 메뉴는 사용 가능
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshStats(true);
  }, [refreshStats]);

  const handleRegionalTotalChange = useCallback((total: number) => {
    setStats((current) => ({
      ...current,
      regionalPages: {
        ...current.regionalPages,
        total,
      },
    }));
  }, []);

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

  function sectionStat(id: MainAdminSectionId): string {
    if (statsLoading) return "집계 중…";
    if (id === "academy") {
      return `${stats.academy.total}건 (인증 ${stats.academy.premium})`;
    }
    if (id === "breeds") return `${stats.breeds}건`;
    if (id === "regional") {
      return `전체 ${stats.regionalPages.total.toLocaleString("ko-KR")}건 · 공개 ${stats.regionalPages.published.toLocaleString("ko-KR")}건`;
    }
    if (id === "advisory") return "위원장 프로필·순서 관리";
    if (id === "care-intake") return "신청·입금·매칭 상태";
    if (id === "care-shelter-partners") return "파트너 승인·관리";
    if (id in stats.listings) return listingStat(id);
    return "—";
  }

  function renderActivePanel() {
    if (!active) return null;

    if (active === "regional") {
      return (
        <RegionalLandingAdminPanel
          onTotalsChange={handleRegionalTotalChange}
        />
      );
    }
    if (active === "advisory") {
      return <AdvisoryMembersAdminPanel />;
    }
    if (active === "care-intake") {
      return <CareIntakeAdminPanel />;
    }
    if (active === "care-shelter-partners") {
      return <CareShelterPartnerAdminPanel />;
    }
    if (active === "academy") {
      return <AcademyAdminPanel embedded />;
    }
    if (active === "breeds") {
      return <BreedAdminPanel embedded />;
    }
    if (isListingCategory(active)) {
      return <ListingAdminPanel category={active} embedded />;
    }
    return null;
  }

  const activeSection = MAIN_ADMIN_SECTIONS.find((s) => s.id === active);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">메인 관리자</h1>
          <p className="mt-1 text-sm text-muted">
            {username} 님 · 아래 메뉴를 선택하면 해당 관리 화면이 표시됩니다.
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
        <h2 className="mb-4 text-lg font-bold">관리 메뉴</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MAIN_ADMIN_SECTIONS.map((svc) => {
            const selected = active === svc.id;
            return (
              <button
                key={svc.id}
                type="button"
                onClick={() => {
                  setActive(svc.id);
                  if (svc.id === "regional") void refreshStats();
                }}
                className={`rounded-2xl border p-5 text-left shadow-[var(--card-shadow)] transition ${
                  selected
                    ? "border-primary bg-indigo-50/50 ring-2 ring-primary/30"
                    : "border-gray-100 bg-white hover:border-primary/30"
                }`}
              >
                <p className="font-semibold text-foreground">{svc.title}</p>
                <p className="mt-1 text-sm text-muted">{sectionStat(svc.id)}</p>
                <Link
                  href={svc.publicHref}
                  target="_blank"
                  onClick={(e) => e.stopPropagation()}
                  className="mt-4 inline-flex items-center gap-1 text-xs text-muted hover:text-foreground"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  공개 페이지
                </Link>
              </button>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-muted">
          메인 관리자 로그인만으로 모든 서비스 관리에 접근할 수 있습니다.
          별도 비밀키 입력이 필요 없습니다.
        </p>
      </section>

      {activeSection ? (
        <section className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 sm:p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">{activeSection.title} 관리</h2>
            <button
              type="button"
              onClick={() => setActive(null)}
              className="text-sm text-muted hover:text-foreground"
            >
              메뉴 닫기
            </button>
          </div>
          {renderActivePanel()}
        </section>
      ) : (
        <p className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-10 text-center text-sm text-muted">
          위에서 관리할 메뉴를 선택하세요.
        </p>
      )}
    </div>
  );
}
