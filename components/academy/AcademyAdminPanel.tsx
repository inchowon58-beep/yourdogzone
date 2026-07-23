"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { KeyRound, RefreshCw, Star, Trash2 } from "lucide-react";
import { uploadToPresignedUrl } from "@/lib/upload/r2-client";
import { adminPanelHeaders, adminPanelJsonHeaders } from "@/lib/admin/panel-headers";

type AcademyRow = {
  slug: string;
  name: string;
  region_big: string;
  region_small: string;
  is_premium: boolean;
  created_at: string;
};

const STORAGE_KEY = "academy-admin-secret";

type Props = {
  /** 메인 관리자(/admin)에 임베드 — 별도 비밀키 없이 쿠키 인증 */
  embedded?: boolean;
};

export function AcademyAdminPanel({ embedded = false }: Props) {
  const [secret, setSecret] = useState("");
  const [inputSecret, setInputSecret] = useState("");
  const [academies, setAcademies] = useState<AcademyRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null);
  const [naverQuery, setNaverQuery] = useState("");
  const [naverSearching, setNaverSearching] = useState(false);
  const [naverImporting, setNaverImporting] = useState<string | null>(null);
  const [naverCandidates, setNaverCandidates] = useState<
    {
      placeId: string;
      name: string;
      address: string;
      phone: string | null;
      thumb: string | null;
      rating?: number | null;
      reviewCount?: number | null;
    }[]
  >([]);

  const allSelected = useMemo(
    () => academies.length > 0 && selected.size === academies.length,
    [academies.length, selected.size]
  );

  const loadAcademies = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/academy/admin", {
        headers: adminPanelHeaders(secret, embedded),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "목록을 불러오지 못했습니다.");
        if (res.status === 401) {
          sessionStorage.removeItem(STORAGE_KEY);
          setSecret("");
        }
        return;
      }

      setAcademies(data.academies ?? []);
      setSelected(new Set());
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [embedded, secret]);

  useEffect(() => {
    if (embedded) {
      void loadAcademies();
      return;
    }
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      setSecret(saved);
      void loadAcademies();
    }
  }, [embedded, loadAcademies]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = inputSecret.trim();
    if (!trimmed) return;
    sessionStorage.setItem(STORAGE_KEY, trimmed);
    setSecret(trimmed);
    void loadAcademies();
  }

  function handleLogout() {
    sessionStorage.removeItem(STORAGE_KEY);
    setSecret("");
    setAcademies([]);
    setSelected(new Set());
    setInputSecret("");
  }

  function toggleSelect(slug: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(academies.map((a) => a.slug)));
    }
  }

  async function togglePremium(academy: AcademyRow) {
    const next = !academy.is_premium;
    setTogglingSlug(academy.slug);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/academy/admin", {
        method: "PATCH",
        headers: adminPanelJsonHeaders(secret, embedded),
        body: JSON.stringify({ slug: academy.slug, is_premium: next }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "변경에 실패했습니다.");
        return;
      }

      if (Array.isArray(data.uploads)) {
        for (const upload of data.uploads as Array<{
          uploadUrl: string;
          contentType: string;
          body: string;
        }>) {
          const putResult = await uploadToPresignedUrl(
            upload.uploadUrl,
            upload.body,
            upload.contentType
          );
          if (!putResult.ok) {
            setError(putResult.error);
            return;
          }
        }
      }

      setAcademies((prev) =>
        prev.map((a) =>
          a.slug === academy.slug ? { ...a, is_premium: next } : a
        )
      );
      setMessage(
        next
          ? `「${academy.name}」을(를) 인증 추천 학원으로 설정했습니다.`
          : `「${academy.name}」을(를) 일반 학원으로 변경했습니다.`
      );
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setTogglingSlug(null);
    }
  }

  async function deleteSelected() {
    if (selected.size === 0) return;

    const names = academies
      .filter((a) => selected.has(a.slug))
      .map((a) => a.name)
      .join(", ");

    const confirmed = window.confirm(
      `선택한 ${selected.size}곳을 삭제할까요?\n\n${names}\n\n이 작업은 되돌릴 수 없습니다.`
    );
    if (!confirmed) return;

    setDeleting(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/academy/admin", {
        method: "DELETE",
        headers: adminPanelJsonHeaders(secret, embedded),
        body: JSON.stringify({ slugs: [...selected] }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "삭제에 실패했습니다.");
        return;
      }

      const deleted = new Set((data.deleted as string[]) ?? []);
      setAcademies((prev) => prev.filter((a) => !deleted.has(a.slug)));
      setSelected(new Set());
      setMessage(`${data.count ?? deleted.size}곳을 삭제했습니다.`);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setDeleting(false);
    }
  }

  async function searchNaver() {
    const q = naverQuery.trim();
    if (!q) return;
    setNaverSearching(true);
    setError("");
    setMessage("");
    setNaverCandidates([]);
    try {
      const res = await fetch("/api/academy/admin/naver", {
        method: "POST",
        headers: adminPanelJsonHeaders(secret, embedded),
        body: JSON.stringify({ action: "search", query: q }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "네이버 검색에 실패했습니다.");
        return;
      }
      setNaverCandidates(data.candidates ?? []);
      if ((data.candidates ?? []).length === 0) {
        setError(data.message ?? "검색 결과가 없습니다.");
      } else {
        setMessage(`${data.candidates.length}건의 네이버 플레이스를 찾았습니다.`);
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setNaverSearching(false);
    }
  }

  async function importNaver(candidate: {
    placeId: string;
    name: string;
    address: string;
    phone: string | null;
    thumb: string | null;
    rating?: number | null;
    reviewCount?: number | null;
  }) {
    if (!confirm(`「${candidate.name}」을(를) 미용학원으로 등록할까요?`)) return;
    setNaverImporting(candidate.placeId);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/academy/admin/naver", {
        method: "POST",
        headers: adminPanelJsonHeaders(secret, embedded),
        body: JSON.stringify({
          action: "import",
          placeId: candidate.placeId,
          name: candidate.name,
          address: candidate.address,
          phone: candidate.phone,
          thumb: candidate.thumb,
          rating: candidate.rating,
          reviewCount: candidate.reviewCount,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "등록에 실패했습니다.");
        return;
      }
      setMessage(
        `✓ 등록됨: ${data.name} → ${data.slug}` +
          (data.imageCount ? ` (사진 ${data.imageCount}장)` : "")
      );
      setNaverCandidates((prev) =>
        prev.filter((c) => c.placeId !== candidate.placeId)
      );
      await loadAcademies();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setNaverImporting(null);
    }
  }

  if (!embedded && !secret) {
    return (
      <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-[var(--card-shadow)]">
        <div className="mb-6 flex items-center gap-2 text-primary">
          <KeyRound className="h-5 w-5" />
          <h1 className="text-lg font-bold">학원 관리자 로그인</h1>
        </div>
        <p className="mb-6 text-sm text-muted">
          Vercel에 설정한 <code className="text-xs">ACADEMY_ADMIN_SECRET</code>{" "}
          값을 입력하세요.
        </p>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="password"
            value={inputSecret}
            onChange={(e) => setInputSecret(e.target.value)}
            placeholder="관리자 비밀키"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white"
          >
            입장
          </button>
        </form>
        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">학원 관리</h1>
          <p className="mt-1 text-sm text-muted">
            네이버 플레이스 등록 · 인증 추천 · 선택 삭제
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selected.size > 0 && (
            <button
              type="button"
              onClick={() => void deleteSelected()}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? "삭제 중..." : `선택 삭제 (${selected.size})`}
            </button>
          )}
          <button
            type="button"
            onClick={() => void loadAcademies()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            새로고침
          </button>
          {!embedded ? (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-muted"
            >
              로그아웃
            </button>
          ) : null}
        </div>
      </div>

      {message && (
        <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <section className="mb-8 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 shadow-[var(--card-shadow)]">
        <h2 className="text-base font-bold text-foreground">
          네이버 플레이스로 업체 등록
        </h2>
        <p className="mt-1 text-sm text-muted">
          업체명으로 검색하거나 네이버지도 플레이스 URL을 붙여넣으세요. 등록 시
          평점·블로그 리뷰(최대 5건)를 함께 저장합니다.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <input
            value={naverQuery}
            onChange={(e) => setNaverQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void searchNaver()}
            placeholder="업체명 또는 https://map.naver.com/.../place/123456"
            className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 sm:min-w-[16rem]"
          />
          <button
            type="button"
            onClick={() => void searchNaver()}
            disabled={naverSearching || !naverQuery.trim()}
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {naverSearching ? "검색 중…" : "검색"}
          </button>
        </div>
        {naverCandidates.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {naverCandidates.map((c) => (
              <li
                key={c.placeId}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-white bg-white px-3 py-3"
              >
                {c.thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.thumb}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs text-muted">
                    사진
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">{c.name}</p>
                  <p className="truncate text-xs text-muted">{c.address}</p>
                  {c.phone ? (
                    <p className="text-xs text-muted">{c.phone}</p>
                  ) : null}
                  {c.rating != null ? (
                    <p className="text-xs font-medium text-amber-700">
                      ★ {c.rating}
                      {c.reviewCount != null ? ` · 리뷰 ${c.reviewCount}` : ""}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  disabled={naverImporting === c.placeId}
                  onClick={() => void importNaver(c)}
                  className="shrink-0 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  {naverImporting === c.placeId ? "등록 중…" : "등록하기"}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {academies.length === 0 && !loading ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-muted shadow-[var(--card-shadow)]">
          등록된 학원이 없습니다.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-[var(--card-shadow)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50/80 text-xs text-muted">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    aria-label="전체 선택"
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </th>
                <th className="px-5 py-3 font-medium">학원명</th>
                <th className="hidden px-5 py-3 font-medium sm:table-cell">지역</th>
                <th className="px-5 py-3 font-medium">인증 추천</th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">slug</th>
              </tr>
            </thead>
            <tbody>
              {academies.map((academy) => (
                <tr
                  key={academy.slug}
                  className={`border-b border-gray-50 last:border-0 ${
                    selected.has(academy.slug) ? "bg-red-50/40" : ""
                  }`}
                >
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selected.has(academy.slug)}
                      onChange={() => toggleSelect(academy.slug)}
                      aria-label={`${academy.name} 선택`}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </td>
                  <td className="px-5 py-4 font-medium">{academy.name}</td>
                  <td className="hidden px-5 py-4 text-muted sm:table-cell">
                    {academy.region_big} {academy.region_small}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      disabled={togglingSlug === academy.slug}
                      onClick={() => void togglePremium(academy)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        academy.is_premium
                          ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                          : "bg-gray-100 text-muted hover:bg-gray-200"
                      } disabled:opacity-50`}
                    >
                      <Star
                        className={`h-3.5 w-3.5 ${
                          academy.is_premium ? "fill-amber-500 text-amber-500" : ""
                        }`}
                      />
                      {togglingSlug === academy.slug
                        ? "저장 중..."
                        : academy.is_premium
                          ? "추천 ON"
                          : "추천 OFF"}
                    </button>
                  </td>
                  <td className="hidden px-5 py-4 text-xs text-muted md:table-cell">
                    <Link
                      href={`/services/academy/${academy.slug}`}
                      className="hover:text-primary"
                    >
                      {academy.slug}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-muted">
        변경·삭제 후 목록 페이지 반영까지 최대 1분 걸릴 수 있습니다.
      </p>
    </div>
  );
}
