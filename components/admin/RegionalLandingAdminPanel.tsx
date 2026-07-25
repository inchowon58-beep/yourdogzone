"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Plus,
  RefreshCw,
  Trash2,
  Globe,
  Eye,
  EyeOff,
} from "lucide-react";
import type { RegionalLandingAdminSummary } from "@/lib/academy/regional-admin-list";
import {
  getRegionalServiceConfig,
  REGIONAL_SERVICE_CATEGORIES,
  type RegionalServiceCategory,
} from "@/lib/seo/regional-service-config";

const PAGE_SIZE = 10;

export function RegionalLandingAdminPanel() {
  const [pages, setPages] = useState<RegionalLandingAdminSummary[]>([]);
  const [listPage, setListPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState<RegionalServiceCategory>("academy");
  const [filterCategory, setFilterCategory] = useState<RegionalServiceCategory | "">(
    ""
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);

  const categoryConfig = getRegionalServiceConfig(category);

  const load = useCallback(async (page: number) => {
    setLoading(true);
    setError("");
    try {
      const categoryQuery = filterCategory
        ? `&category=${encodeURIComponent(filterCategory)}`
        : "";
      const res = await fetch(
        `/api/admin/regional-landings?page=${page}&limit=${PAGE_SIZE}${categoryQuery}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "불러오기 실패");
      setPages(data.pages ?? []);
      setListPage(data.page ?? page);
      setTotalPages(data.totalPages ?? 1);
      setTotal(data.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류");
    } finally {
      setLoading(false);
    }
  }, [filterCategory]);

  useEffect(() => {
    void load(listPage);
  }, [listPage, load]);

  useEffect(() => {
    setListPage(1);
  }, [filterCategory]);

  async function generateOne() {
    const kw = keyword.trim();
    if (!kw) return;
    setMessage("");
    setError("");
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/regional-landings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", keyword: kw, category }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "생성 실패");
      const path = getRegionalServiceConfig(
        data.page.category ?? category
      ).basePath;
      setMessage(
        `✓ 생성됨: ${data.page.label} → ${path}/region/${data.page.slug}` +
          (data.isSlugVariant ? " (기존 페이지 있음 → 새 URL)" : "") +
          (data.geminiUsed ? " (Gemini)" : "") +
          (data.geminiError ? ` | Gemini 스킵: ${data.geminiError}` : "")
      );
      setKeyword("");
      if (listPage === 1) void load(1);
      else setListPage(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류");
    } finally {
      setGenerating(false);
    }
  }

  async function togglePublish(summary: RegionalLandingAdminSummary) {
    const res = await fetch("/api/admin/regional-landings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "toggle_publish",
        slug: summary.slug,
        category: summary.category,
        isPublished: !summary.isPublished,
      }),
    });
    if (res.ok) void load(listPage);
  }

  async function remove(summary: RegionalLandingAdminSummary) {
    if (!confirm("이 지역 페이지를 삭제할까요?")) return;
    const res = await fetch(
      `/api/admin/regional-landings?slug=${encodeURIComponent(summary.slug)}&category=${encodeURIComponent(summary.category)}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      const nextPage =
        pages.length === 1 && listPage > 1 ? listPage - 1 : listPage;
      setListPage(nextPage);
      void load(nextPage);
    }
  }

  function formatDate(iso: string) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-[var(--card-shadow)]">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Globe className="h-5 w-5 text-primary" />
            지역 SEO 페이지
          </h2>
          <p className="mt-1 text-sm text-muted">
            카테고리 선택 후 키워드 1건씩 생성합니다. 최신순 · 페이지당{" "}
            {PAGE_SIZE}건 · 목록은 최신 index를 직접 조회합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load(listPage)}
          className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm"
        >
          <RefreshCw className="h-4 w-4" />
          새로고침
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-muted">발행 카테고리</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as RegionalServiceCategory)}
          disabled={generating}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          {REGIONAL_SERVICE_CATEGORIES.map((id) => (
            <option key={id} value={id}>
              {getRegionalServiceConfig(id).title}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6 rounded-xl bg-gray-50 p-4">
        <p className="mb-2 text-sm font-semibold">키워드 1건 생성</p>
        <div className="flex gap-2">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={`예: 평택 ${categoryConfig.defaultKeywordSuffix} / 평택강아지파양`}
            className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm"
            onKeyDown={(e) => e.key === "Enter" && void generateOne()}
            disabled={generating}
          />
          <button
            type="button"
            onClick={() => void generateOne()}
            disabled={generating}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            {generating ? "생성 중…" : "생성"}
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-muted">목록 필터</label>
        <select
          value={filterCategory}
          onChange={(e) =>
            setFilterCategory(e.target.value as RegionalServiceCategory | "")
          }
          className="rounded-lg border px-3 py-2 text-sm"
        >
          <option value="">전체 카테고리</option>
          {REGIONAL_SERVICE_CATEGORIES.map((id) => (
            <option key={id} value={id}>
              {getRegionalServiceConfig(id).title}
            </option>
          ))}
        </select>
      </div>

      {message && <p className="mb-3 text-sm text-emerald-700">{message}</p>}
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
        <span>전체 {total}건</span>
        <span>
          {listPage} / {totalPages} 페이지
        </span>
      </div>

      {loading ? (
        <p className="text-sm text-muted">불러오는 중…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b text-muted">
                <th className="py-2 pr-4">최근 작업일</th>
                <th className="py-2 pr-4">카테고리</th>
                <th className="py-2 pr-4">지역</th>
                <th className="py-2 pr-4">키워드</th>
                <th className="py-2 pr-4">영문 URL</th>
                <th className="py-2 pr-4">SEO</th>
                <th className="py-2 pr-4">상태</th>
                <th className="py-2">관리</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p) => (
                <tr key={`${p.category}-${p.slug}`} className="border-b border-gray-50">
                  <td className="py-3 pr-4 text-muted whitespace-nowrap">
                    {formatDate(p.updatedAt || p.createdAt)}
                  </td>
                  <td className="py-3 pr-4 text-muted whitespace-nowrap">
                    {p.categoryTitle}
                  </td>
                  <td className="py-3 pr-4 font-medium">{p.label}</td>
                  <td className="py-3 pr-4 text-muted">{p.keyword}</td>
                  <td className="py-3 pr-4">
                    <code className="text-xs">{p.slug}</code>
                  </td>
                  <td className="py-3 pr-4">
                    {p.hasSeo ? (
                      <span className="text-emerald-600">완료</span>
                    ) : (
                      <span className="text-amber-600">대기</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    {p.isPublished ? (
                      <span className="text-emerald-600">공개</span>
                    ) : (
                      <span className="text-gray-400">비공개</span>
                    )}
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={p.path}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        보기
                      </Link>
                      <button
                        type="button"
                        onClick={() => void togglePublish(p)}
                        className="inline-flex items-center gap-1 text-muted hover:text-foreground"
                      >
                        {p.isPublished ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                        {p.isPublished ? "숨김" : "공개"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void remove(p)}
                        className="inline-flex items-center gap-1 text-red-600 hover:underline"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pages.length === 0 && (
            <p className="py-8 text-center text-sm text-muted">
              등록된 지역 페이지가 없습니다. 카테고리를 선택하고 키워드를 입력해
              생성하세요.
            </p>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <nav
          className="mt-6 flex flex-wrap items-center justify-center gap-1.5"
          aria-label="SEO 페이지 목록"
        >
          <button
            type="button"
            disabled={listPage <= 1 || loading}
            onClick={() => setListPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-2 text-sm disabled:opacity-40"
            aria-label="이전"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: Math.min(20, totalPages) }, (_, i) => {
            const maxButtons = 20;
            let start = 1;
            if (totalPages > maxButtons) {
              start = Math.max(
                1,
                Math.min(
                  listPage - Math.floor(maxButtons / 2),
                  totalPages - maxButtons + 1
                )
              );
            }
            const pageNum = start + i;
            if (pageNum > totalPages) return null;
            const active = pageNum === listPage;
            return (
              <button
                key={pageNum}
                type="button"
                disabled={loading}
                onClick={() => setListPage(pageNum)}
                className={
                  active
                    ? "min-w-9 rounded-lg bg-primary px-2.5 py-2 text-sm font-semibold text-white"
                    : "min-w-9 rounded-lg border px-2.5 py-2 text-sm text-foreground hover:bg-gray-50 disabled:opacity-40"
                }
                aria-current={active ? "page" : undefined}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            type="button"
            disabled={listPage >= totalPages || loading}
            onClick={() => setListPage((p) => Math.min(totalPages, p + 1))}
            className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-2 text-sm disabled:opacity-40"
            aria-label="다음"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      )}
    </section>
  );
}
