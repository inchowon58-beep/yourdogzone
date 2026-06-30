"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { KeyRound, RefreshCw, Trash2 } from "lucide-react";
import { breedDetailPath } from "@/lib/breeds/config";
import { uploadToPresignedUrl } from "@/lib/upload/r2-client";

type BreedRow = {
  slug: string;
  name_ko: string;
  name_en: string;
  kind: string;
  size_label: string;
  updated_at: string;
  source: "seed" | "r2";
};

const STORAGE_KEY = "breed-admin-secret";

export function BreedAdminPanel() {
  const [secret, setSecret] = useState("");
  const [inputSecret, setInputSecret] = useState("");
  const [breeds, setBreeds] = useState<BreedRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const r2Breeds = useMemo(() => breeds.filter((b) => b.source === "r2"), [breeds]);

  const allR2Selected = useMemo(
    () => r2Breeds.length > 0 && r2Breeds.every((b) => selected.has(b.slug)),
    [r2Breeds, selected]
  );

  const loadBreeds = useCallback(async (adminSecret: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/breeds/admin", {
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
      setBreeds(data.breeds ?? []);
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
      void loadBreeds(saved);
    }
  }, [loadBreeds]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = inputSecret.trim();
    if (!trimmed) return;
    sessionStorage.setItem(STORAGE_KEY, trimmed);
    setSecret(trimmed);
    void loadBreeds(trimmed);
  }

  function handleLogout() {
    sessionStorage.removeItem(STORAGE_KEY);
    setSecret("");
    setBreeds([]);
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

  function toggleSelectAllR2() {
    if (allR2Selected) {
      setSelected((prev) => {
        const next = new Set(prev);
        for (const b of r2Breeds) next.delete(b.slug);
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        for (const b of r2Breeds) next.add(b.slug);
        return next;
      });
    }
  }

  async function handleDelete() {
    const slugs = [...selected].filter((slug) =>
      r2Breeds.some((b) => b.slug === slug)
    );
    if (slugs.length === 0) {
      setError("R2에 등록된 견종만 삭제할 수 있습니다. 시드 데이터는 삭제되지 않습니다.");
      return;
    }
    if (!confirm(`${slugs.length}개 견종을 삭제할까요?`)) return;

    setDeleting(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/breeds/admin", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": secret,
        },
        body: JSON.stringify({ slugs }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "삭제에 실패했습니다.");
        return;
      }
      if (Array.isArray(data.uploads)) {
        for (const task of data.uploads) {
          const up = await uploadToPresignedUrl(
            task.uploadUrl,
            task.body,
            task.contentType
          );
          if (!up.ok) {
            setError(up.error);
            return;
          }
        }
      }
      setMessage(`${data.count ?? slugs.length}개 삭제 완료`);
      await loadBreeds(secret);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setDeleting(false);
    }
  }

  if (!secret) {
    return (
      <form onSubmit={handleLogin} className="mx-auto max-w-sm space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <KeyRound className="h-5 w-5 text-primary" />
          견종 관리자 로그인
        </div>
        <input
          type="password"
          value={inputSecret}
          onChange={(e) => setInputSecret(e.target.value)}
          placeholder="관리자 시크릿"
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white"
        >
          로그인
        </button>
      </form>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">견종 관리</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void loadBreeds(secret)}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            새로고침
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-muted"
          >
            로그아웃
          </button>
        </div>
      </div>

      <p className="mb-4 text-sm text-muted">
        시드 데이터({breeds.filter((b) => b.source === "seed").length}종)는 코드에 포함되어
        있으며, R2 등록분({r2Breeds.length}종)만 삭제할 수 있습니다. 사진·내용 수정은{" "}
        <Link href="/dognose/register" className="text-primary underline">
          등록 페이지
        </Link>
        에서 동일 slug로 다시 등록하면 덮어씁니다.
      </p>

      {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      {message && (
        <p className="mb-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">{message}</p>
      )}

      {r2Breeds.length > 0 && (
        <div className="mb-4 flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={allR2Selected}
              onChange={toggleSelectAllR2}
            />
            R2 등록분 전체 선택
          </label>
          <button
            type="button"
            disabled={deleting || selected.size === 0}
            onClick={() => void handleDelete()}
            className="inline-flex items-center gap-1 rounded-xl bg-red-600 px-3 py-2 text-sm text-white disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" />
            선택 삭제
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[var(--card-shadow)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50/80 text-xs text-muted">
            <tr>
              <th className="px-4 py-3 w-10" />
              <th className="px-4 py-3">견종</th>
              <th className="hidden px-4 py-3 sm:table-cell">종류</th>
              <th className="hidden px-4 py-3 md:table-cell">출처</th>
              <th className="px-4 py-3">링크</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {breeds.map((row) => (
              <tr key={row.slug} className="hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  {row.source === "r2" && (
                    <input
                      type="checkbox"
                      checked={selected.has(row.slug)}
                      onChange={() => toggleSelect(row.slug)}
                    />
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{row.name_ko}</div>
                  <div className="text-xs text-muted">{row.name_en}</div>
                </td>
                <td className="hidden px-4 py-3 sm:table-cell text-muted">
                  {row.size_label}
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      row.source === "seed"
                        ? "bg-gray-100 text-muted"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {row.source === "seed" ? "시드" : "R2"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={breedDetailPath(row.slug)}
                    className="text-xs text-primary hover:underline"
                  >
                    보기
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {breeds.length === 0 && !loading && (
          <p className="py-12 text-center text-muted">등록된 견종이 없습니다.</p>
        )}
      </div>
    </div>
  );
}
