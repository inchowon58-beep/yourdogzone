"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, MapPin } from "lucide-react";
import type { Academy } from "@/lib/types/academy";
import {
  ACADEMY_GUIDE_TABS,
  type AcademyGuideTab,
} from "@/lib/academy/guide-content";
import {
  buildGeoAcademyHeading,
  resolveGeoLabel,
} from "@/lib/academy/geo-label";
import { getAcademyThumbnail } from "@/lib/academy/images";
import { AcademyThumbnail } from "@/components/academy/AcademyThumbnail";

type AcademyGuideTabsProps = {
  region: string;
  query?: string;
  academies: Academy[];
  /** 가이드 하단 미리보기용 (서버에서 인증추천 랜덤 5개 등으로 전달) */
  previewAcademies?: Academy[];
  /** 목록 페이지 앵커 대신 사용할 링크 (상세 페이지용) */
  listHref?: string;
  /** 하단 전체 목록 건수 (미리보기 링크용) */
  totalListCount?: number;
  /** 인증추천 전체 건수 (가이드 미리보기 링크용) */
  premiumListCount?: number;
};

function GuidePanel({
  tab,
  geoLabel,
  academies,
  previewAcademies,
  listHref,
  totalListCount,
  premiumListCount,
}: {
  tab: AcademyGuideTab;
  geoLabel: string | null;
  academies: Academy[];
  previewAcademies?: Academy[];
  listHref?: string;
  totalListCount?: number;
  premiumListCount?: number;
}) {
  const regionalHeading = buildGeoAcademyHeading(geoLabel, tab.geoHint ?? "");
  const preview = previewAcademies ?? [];
  const listTotal = totalListCount ?? academies.length;
  const premiumTotal = premiumListCount ?? preview.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground sm:text-xl">
          {tab.headline}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{tab.intro}</p>
      </div>

      <div className="space-y-5">
        {tab.sections.map((section) => (
          <div
            key={section.title}
            className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 sm:p-5"
          >
            <h3 className="text-sm font-semibold text-foreground">
              {section.title}
            </h3>
            <ul className="mt-3 space-y-2">
              {section.items.map((item) => (
                <li
                  key={item}
                  className="flex gap-2 text-sm leading-relaxed text-muted"
                >
                  <span
                    className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary"
                    aria-hidden
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-foreground">
          {regionalHeading}
        </h3>
        <p className="mt-1 text-xs text-muted">
          {preview.length > 0
            ? `전국 인증 추천 학원 중 ${preview.length}곳을 소개합니다. 새로고침 시 다른 학원이 노출될 수 있습니다.`
            : geoLabel
              ? `${geoLabel} 지역 검색 결과를 바탕으로 학원을 비교해 보세요.`
              : "지역 탭이나 검색창에 동네·시군구 이름을 입력하면 맞춤 리스트가 표시됩니다."}
        </p>

        {preview.length > 0 ? (
          <ul className="mt-4 divide-y divide-indigo-100/80 rounded-lg bg-white/80">
            {preview.map((academy) => (
              <li key={academy.id}>
                <Link
                  href={`/services/academy/${academy.slug}`}
                  className="flex items-center gap-3 px-3 py-3.5 transition-colors hover:bg-white sm:gap-4 sm:px-4 sm:py-4"
                >
                  <AcademyThumbnail
                    src={getAcademyThumbnail(academy)}
                    alt={academy.name}
                    className="h-14 w-14 shrink-0 rounded-xl sm:h-16 sm:w-16"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {academy.name}
                      {academy.is_premium && (
                        <span className="ml-1.5 text-xs font-semibold text-primary">
                          인증
                        </span>
                      )}
                    </p>
                    {academy.title_copy ? (
                      <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted sm:line-clamp-1">
                        {academy.title_copy}
                      </p>
                    ) : null}
                    <p className="mt-1 flex items-start gap-1 text-xs text-muted">
                      <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                      <span className="line-clamp-2 sm:truncate">
                        {academy.region_big} {academy.region_small}
                        {academy.address ? ` · ${academy.address}` : ""}
                      </span>
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">
            해당 조건의 등록 학원이 아직 없습니다.{" "}
            <Link href="/services/academy/register" className="text-primary hover:underline">
              학원 등록
            </Link>
            을 요청하거나 다른 지역을 검색해 보세요.
          </p>
        )}

        {premiumTotal > preview.length && preview.length > 0 && (
          <p className="mt-3 text-xs text-muted">
            인증 추천 학원 전체 {premiumTotal}곳 중 {preview.length}곳 표시
          </p>
        )}

        {listTotal > 0 && (
          listHref ? (
            <Link
              href={listHref}
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              {geoLabel ? `${geoLabel} ` : ""}학원 전체 {listTotal}곳 보기
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <a
              href="#academy-list"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              {geoLabel ? `${geoLabel} ` : ""}학원 전체 {listTotal}곳 보기
              <ChevronRight className="h-4 w-4" />
            </a>
          )
        )}
      </div>
    </div>
  );
}

export function AcademyGuideTabs({
  region,
  query,
  academies,
  previewAcademies,
  listHref,
  totalListCount,
  premiumListCount,
}: AcademyGuideTabsProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const geoLabel = resolveGeoLabel(region, query);
  const activeTab = activeId
    ? ACADEMY_GUIDE_TABS.find((t) => t.id === activeId)
    : null;

  function handleTabClick(tabId: string) {
    setActiveId((prev) => (prev === tabId ? null : tabId));
  }

  return (
    <section
      className="mb-10 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[var(--card-shadow)]"
      aria-label="애견미용학원 선택 가이드"
    >
      <p className="border-b border-gray-100 px-4 py-3 text-sm text-muted sm:px-4">
        아래 학원 선택 가이드를 참고하세요.
      </p>

      <div
        role="tablist"
        aria-label="가이드 카테고리"
        className="flex gap-1.5 overflow-x-auto px-3 py-3 scrollbar-hide sm:gap-2 sm:px-4"
      >
        {ACADEMY_GUIDE_TABS.map((tab) => {
          const selected = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`guide-tab-${tab.id}`}
              aria-selected={selected}
              aria-expanded={selected}
              aria-controls={`guide-panel-${tab.id}`}
              onClick={() => handleTabClick(tab.id)}
              className={`shrink-0 rounded-xl px-3 py-2 text-left text-xs font-medium transition-all sm:px-4 sm:py-2.5 sm:text-sm ${
                selected
                  ? "bg-primary text-white shadow-sm"
                  : "bg-gray-100/80 text-muted hover:bg-gray-100 hover:text-foreground"
              }`}
            >
              <span className="mr-1" aria-hidden>
                {tab.emoji}
              </span>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {activeTab && (
        <div
          role="tabpanel"
          id={`guide-panel-${activeTab.id}`}
          aria-labelledby={`guide-tab-${activeTab.id}`}
          className="border-t border-gray-100 p-4 sm:p-6"
        >
          <GuidePanel
            tab={activeTab}
            geoLabel={geoLabel}
            academies={academies}
            previewAcademies={previewAcademies}
            listHref={listHref}
            totalListCount={totalListCount}
            premiumListCount={premiumListCount}
          />
        </div>
      )}
    </section>
  );
}
