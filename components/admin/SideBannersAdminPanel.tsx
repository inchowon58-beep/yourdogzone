"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Loader2, Trash2, Upload } from "lucide-react";
import { uploadImageToR2 } from "@/lib/upload/r2-client";
import type { SiteBannerSlot, SiteSideBanner } from "@/lib/types/site-banner";

export function SideBannersAdminPanel() {
  const [items, setItems] = useState<SiteSideBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    slot: "right" as SiteBannerSlot,
    title: "",
    href: "/",
    enabled: true,
  });
  const [file, setFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/side-banners");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "목록을 불러오지 못했습니다.");
        return;
      }
      setItems(data.banners ?? []);
    } catch {
      setError("네트워크 오류");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      alert("배너 이미지를 선택해 주세요.");
      return;
    }
    setSaving(true);
    try {
      const up = await uploadImageToR2(file);
      if (!up.ok) {
        alert(up.error);
        return;
      }
      const res = await fetch("/api/admin/side-banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          image_url: up.url,
          sort_order: items.length,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "등록 실패");
        return;
      }
      setForm({ slot: "right", title: "", href: "/", enabled: true });
      setFile(null);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function toggleEnabled(banner: SiteSideBanner) {
    const res = await fetch("/api/admin/side-banners", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: banner.id, enabled: !banner.enabled }),
    });
    if (res.ok) await load();
  }

  async function remove(id: string) {
    if (!confirm("이 배너를 삭제할까요?")) return;
    const res = await fetch(`/api/admin/side-banners?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res.ok) await load();
  }

  if (loading) return <p className="text-sm text-muted">불러오는 중…</p>;
  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        홈 화면 좌·우에 표시되는 세로 배너입니다. 권장 비율은 세로형(약
        160×480)입니다.
      </p>

      <form
        onSubmit={handleCreate}
        className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[var(--card-shadow)]"
      >
        <h3 className="text-base font-bold text-foreground">배너 추가</h3>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-semibold">위치</span>
            <select
              value={form.slot}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  slot: e.target.value as SiteBannerSlot,
                }))
              }
              className="h-11 w-full rounded-xl border border-gray-200 px-3"
            >
              <option value="left">왼쪽</option>
              <option value="right">오른쪽</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-semibold">제목</span>
            <input
              required
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              className="h-11 w-full rounded-xl border border-gray-200 px-3"
              placeholder="배너 이름"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-semibold">링크 URL</span>
            <input
              value={form.href}
              onChange={(e) => setForm((f) => ({ ...f, href: e.target.value }))}
              className="h-11 w-full rounded-xl border border-gray-200 px-3"
              placeholder="/care-matching 또는 https://..."
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-semibold">이미지</span>
            <div className="flex h-11 items-center gap-2 rounded-xl border border-dashed border-gray-300 px-3">
              <Upload className="h-4 w-4 text-muted" aria-hidden />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="text-sm"
              />
            </div>
          </label>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              등록 중…
            </>
          ) : (
            "배너 등록"
          )}
        </button>
      </form>

      <ul className="space-y-3">
        {items.length === 0 && (
          <li className="rounded-xl bg-gray-50 px-4 py-6 text-center text-sm text-muted">
            등록된 배너가 없습니다.
          </li>
        )}
        {items.map((b) => (
          <li
            key={b.id}
            className="flex flex-wrap items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={b.image_url}
              alt={b.title}
              className="h-28 w-16 rounded-lg object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-foreground">
                [{b.slot === "left" ? "왼쪽" : "오른쪽"}] {b.title}
              </p>
              <p className="mt-1 truncate text-xs text-muted">{b.href}</p>
              <p className="mt-1 text-xs text-muted">
                {b.enabled ? "노출 중" : "숨김"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void toggleEnabled(b)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold"
              >
                {b.enabled ? "숨기기" : "노출"}
              </button>
              <button
                type="button"
                onClick={() => void remove(b.id)}
                className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
                삭제
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
