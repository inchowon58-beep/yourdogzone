"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { KeyRound, RefreshCw, Star, Trash2 } from "lucide-react";
import { uploadToPresignedUrl } from "@/lib/upload/r2-client";

type AcademyRow = {
  slug: string;
  name: string;
  region_big: string;
  region_small: string;
  is_premium: boolean;
  created_at: string;
};

const STORAGE_KEY = "academy-admin-secret";

export function AcademyAdminPanel() {
  const [secret, setSecret] = useState("");
  const [inputSecret, setInputSecret] = useState("");
  const [academies, setAcademies] = useState<AcademyRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null);

  const allSelected = useMemo(
    () => academies.length > 0 && selected.size === academies.length,
    [academies.length, selected.size]
  );

  const loadAcademies = useCallback(async (adminSecret: string) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/academy/admin", {
        headers: { "x-admin-secret": adminSecret },
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
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      setSecret(saved);
      void loadAcademies(saved);
    }
  }, [loadAcademies]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = inputSecret.trim();
    if (!trimmed) return;
    sessionStorage.setItem(STORAGE_KEY, trimmed);
    setSecret(trimmed);
    void loadAcademies(trimmed);
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
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": secret,
        },
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

  if (!secret) {
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
            인증 추천 on/off · 업체 선택 후 삭제
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
            onClick={() => void loadAcademies(secret)}
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
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

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
