"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { KeyRound, RefreshCw, Star, Trash2 } from "lucide-react";
import { getListingConfig, listingBasePath } from "@/lib/listings/config";
import { uploadToPresignedUrl } from "@/lib/upload/r2-client";
import type { ListingCategory } from "@/lib/types/listing";

type ListingRow = {
  slug: string;
  name: string;
  region_big: string;
  region_small: string;
  is_premium: boolean;
  created_at: string;
};

function storageKey(category: ListingCategory) {
  return `listing-admin-secret-${category}`;
}

export function ListingAdminPanel({ category }: { category: ListingCategory }) {
  const config = getListingConfig(category);
  const basePath = listingBasePath(category);
  const apiBase = `/api/listings/${category}/admin`;

  const [secret, setSecret] = useState("");
  const [inputSecret, setInputSecret] = useState("");
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null);

  const allSelected = useMemo(
    () => listings.length > 0 && selected.size === listings.length,
    [listings.length, selected.size]
  );

  const loadListings = useCallback(
    async (adminSecret: string) => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(apiBase, {
          headers: { "x-admin-secret": adminSecret },
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "목록을 불러오지 못했습니다.");
          if (res.status === 401) {
            sessionStorage.removeItem(storageKey(category));
            setSecret("");
          }
          return;
        }
        setListings(data.listings ?? []);
        setSelected(new Set());
      } catch {
        setError("네트워크 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    },
    [apiBase, category]
  );

  useEffect(() => {
    const saved = sessionStorage.getItem(storageKey(category));
    if (saved) {
      setSecret(saved);
      void loadListings(saved);
    }
  }, [category, loadListings]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = inputSecret.trim();
    if (!trimmed) return;
    sessionStorage.setItem(storageKey(category), trimmed);
    setSecret(trimmed);
    void loadListings(trimmed);
  }

  function handleLogout() {
    sessionStorage.removeItem(storageKey(category));
    setSecret("");
    setListings([]);
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
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(listings.map((item) => item.slug)));
  }

  async function togglePremium(row: ListingRow) {
    const next = !row.is_premium;
    setTogglingSlug(row.slug);
    setError("");
    setMessage("");
    try {
      const res = await fetch(apiBase, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": secret,
        },
        body: JSON.stringify({ slug: row.slug, is_premium: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "변경에 실패했습니다.");
        return;
      }
      if (Array.isArray(data.uploads)) {
        for (const upload of data.uploads) {
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
      setListings((prev) =>
        prev.map((item) =>
          item.slug === row.slug ? { ...item, is_premium: next } : item
        )
      );
      setMessage(
        next
          ? `${row.name} — ${config.premiumLabel}으로 설정했습니다.`
          : `${row.name} — 일반 목록으로 변경했습니다.`
      );
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setTogglingSlug(null);
    }
  }

  async function deleteSelected() {
    if (selected.size === 0) return;
    if (!confirm(`선택한 ${selected.size}건을 삭제할까요?`)) return;
    setDeleting(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(apiBase, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": secret,
        },
        body: JSON.stringify({ slugs: [...selected] }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "삭제에 실패했습니다.");
        return;
      }
      setMessage(`${data.count}건 삭제했습니다.`);
      await loadListings(secret);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setDeleting(false);
    }
  }

  if (!secret) {
    return (
      <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-[var(--card-shadow)]">
        <div className="mb-6 flex items-center gap-2 text-primary">
          <KeyRound className="h-5 w-5" />
          <h1 className="text-lg font-bold">{config.title} 관리자 로그인</h1>
        </div>
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
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{config.title} 관리</h1>
          <p className="mt-1 text-sm text-muted">인증 추천 on/off · 선택 삭제</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selected.size > 0 && (
            <button
              type="button"
              onClick={() => void deleteSelected()}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? "삭제 중..." : `선택 삭제 (${selected.size})`}
            </button>
          )}
          <button
            type="button"
            onClick={() => void loadListings(secret)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            새로고침
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-muted"
          >
            로그아웃
          </button>
        </div>
      </div>

      {message && (
        <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {listings.length === 0 && !loading ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-muted shadow-[var(--card-shadow)]">
          등록된 {config.singular}이 없습니다.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-[var(--card-shadow)]">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50/80 text-xs text-muted">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    aria-label="전체 선택"
                    className="h-4 w-4"
                  />
                </th>
                <th className="px-5 py-3 font-medium">이름</th>
                <th className="hidden px-5 py-3 font-medium sm:table-cell">지역</th>
                <th className="px-5 py-3 font-medium">인증 추천</th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">slug</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((row) => (
                <tr key={row.slug} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selected.has(row.slug)}
                      onChange={() => toggleSelect(row.slug)}
                      className="h-4 w-4"
                    />
                  </td>
                  <td className="px-5 py-4 font-medium">{row.name}</td>
                  <td className="hidden px-5 py-4 text-muted sm:table-cell">
                    {row.region_big} {row.region_small}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      disabled={togglingSlug === row.slug}
                      onClick={() => void togglePremium(row)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                        row.is_premium
                          ? "bg-amber-100 text-amber-800"
                          : "bg-gray-100 text-muted"
                      }`}
                    >
                      <Star
                        className={`h-3.5 w-3.5 ${
                          row.is_premium ? "fill-amber-500 text-amber-500" : ""
                        }`}
                      />
                      {row.is_premium ? "추천 ON" : "추천 OFF"}
                    </button>
                  </td>
                  <td className="hidden px-5 py-4 text-xs text-muted md:table-cell">
                    <Link href={`${basePath}/${row.slug}`} className="hover:text-primary">
                      {row.slug}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
