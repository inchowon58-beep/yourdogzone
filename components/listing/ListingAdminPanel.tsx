"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { KeyRound, Pencil, RefreshCw, Star, Trash2, Upload, X } from "lucide-react";
import { getListingConfig, listingBasePath } from "@/lib/listings/config";
import { uploadImageToR2, uploadToPresignedUrl } from "@/lib/upload/r2-client";
import { adminPanelHeaders, adminPanelJsonHeaders } from "@/lib/admin/panel-headers";
import type { ListingCategory } from "@/lib/types/listing";
import { SeoHeroBanner } from "@/components/seo/SeoHeroBanner";
import { DEFAULT_SEO_HERO_OVERLAY } from "@/lib/seo/seo-hero";

type ListingRow = {
  slug: string;
  name: string;
  region_big: string;
  region_small: string;
  is_premium: boolean;
  created_at: string;
  phone?: string | null;
  address?: string;
  logo_image?: string | null;
};

type EditForm = {
  slug: string;
  name: string;
  address: string;
  phone: string;
  title_copy: string;
  region_big: string;
  region_small: string;
  logo_image: string;
  gallery_images: string;
  service_info: string;
  naver_place_url: string;
  seo_detail_html: string;
  homepage_url: string;
  seo_hero_image: string;
  seo_hero_overlay: string;
  seo_hero_line1: string;
  seo_hero_line2: string;
};

function storageKey(category: ListingCategory) {
  return `listing-admin-secret-${category}`;
}

export function ListingAdminPanel({
  category,
  embedded = false,
}: {
  category: ListingCategory;
  embedded?: boolean;
}) {
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
      category: string | null;
      naverPlaceUrl: string;
      rating?: number | null;
      reviewCount?: number | null;
    }[]
  >([]);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [seoHeroUploading, setSeoHeroUploading] = useState(false);

  const naverApi = `/api/listings/${category}/admin/naver`;
  const naverEnabled = true;

  const allSelected = useMemo(
    () => listings.length > 0 && selected.size === listings.length,
    [listings.length, selected.size]
  );

  const loadListings = useCallback(
    async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(apiBase, {
          headers: adminPanelHeaders(secret, embedded),
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
    [apiBase, category, embedded, secret]
  );

  useEffect(() => {
    if (embedded) {
      void loadListings();
      return;
    }
    const saved = sessionStorage.getItem(storageKey(category));
    if (saved) {
      setSecret(saved);
      void loadListings();
    }
  }, [category, embedded, loadListings]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = inputSecret.trim();
    if (!trimmed) return;
    sessionStorage.setItem(storageKey(category), trimmed);
    setSecret(trimmed);
    void loadListings();
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
        headers: adminPanelJsonHeaders(secret, embedded),
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
        headers: adminPanelJsonHeaders(secret, embedded),
        body: JSON.stringify({ slugs: [...selected] }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "삭제에 실패했습니다.");
        return;
      }
      setMessage(`${data.count}건 삭제했습니다.`);
      await loadListings();
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
      const res = await fetch(naverApi, {
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
    if (!confirm(`「${candidate.name}」을(를) ${config.singular}로 등록할까요?`)) return;
    setNaverImporting(candidate.placeId);
    setError("");
    setMessage("");
    try {
      const res = await fetch(naverApi, {
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
      await loadListings();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setNaverImporting(null);
    }
  }

  async function openEdit(row: ListingRow) {
    setError("");
    setMessage("");
    try {
      const res = await fetch(`${apiBase}?slug=${encodeURIComponent(row.slug)}`, {
        headers: adminPanelHeaders(secret, embedded),
      });
      const text = await res.text();
      let data: { listing?: EditForm & Record<string, unknown>; error?: string } =
        {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        setError(
          `상세 응답을 읽지 못했습니다. (${res.status}) ${text.slice(0, 80)}`
        );
        return;
      }
      if (!res.ok || !data.listing) {
        setError(data.error ?? "상세를 불러오지 못했습니다.");
        return;
      }
      const L = data.listing;
      setEditForm({
        slug: String(L.slug ?? ""),
        name: String(L.name ?? ""),
        address: String(L.address ?? ""),
        phone: String(L.phone ?? ""),
        title_copy: String(L.title_copy ?? ""),
        region_big: String(L.region_big ?? ""),
        region_small: String(L.region_small ?? ""),
        logo_image: String(L.logo_image ?? ""),
        gallery_images: Array.isArray(L.gallery_images)
          ? (L.gallery_images as string[]).join("\n")
          : "",
        service_info: String(L.service_info ?? ""),
        naver_place_url: String(L.naver_place_url ?? ""),
        seo_detail_html: String(L.seo_detail_html ?? ""),
        homepage_url: String(L.homepage_url ?? ""),
        seo_hero_image: String(L.seo_hero_image ?? ""),
        seo_hero_overlay: String(L.seo_hero_overlay ?? DEFAULT_SEO_HERO_OVERLAY),
        seo_hero_line1: String(L.seo_hero_line1 ?? ""),
        seo_hero_line2: String(L.seo_hero_line2 ?? ""),
      });
    } catch (e) {
      setError(
        `네트워크 오류가 발생했습니다.${e instanceof Error ? ` (${e.message})` : ""}`
      );
    }
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editForm) return;
    setEditSaving(true);
    setError("");
    setMessage("");
    try {
      const gallery = editForm.gallery_images
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch(apiBase, {
        method: "PATCH",
        headers: adminPanelJsonHeaders(secret, embedded),
        body: JSON.stringify({
          action: "update",
          slug: editForm.slug,
          name: editForm.name,
          address: editForm.address,
          phone: editForm.phone || null,
          title_copy: editForm.title_copy || null,
          region_big: editForm.region_big,
          region_small: editForm.region_small,
          logo_image: editForm.logo_image || null,
          gallery_images: gallery.length ? gallery : null,
          service_info: editForm.service_info || null,
          naver_place_url: editForm.naver_place_url || null,
          seo_detail_html: editForm.seo_detail_html || null,
          homepage_url: editForm.homepage_url || null,
          seo_hero_image: editForm.seo_hero_image || null,
          seo_hero_overlay: editForm.seo_hero_overlay || null,
          seo_hero_line1: editForm.seo_hero_line1 || null,
          seo_hero_line2: editForm.seo_hero_line2 || null,
        }),
      });
      const data = await res.json().catch(() => ({} as { error?: string; uploads?: unknown[] }));
      if (!res.ok) {
        setError(data.error ?? `수정에 실패했습니다. (${res.status})`);
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
      setMessage(`${editForm.name} 정보를 저장했습니다.`);
      setEditForm(null);
      await loadListings();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setEditSaving(false);
    }
  }

  async function handleSeoHeroUpload(file: File | null) {
    if (!file || !editForm) return;
    setSeoHeroUploading(true);
    setError("");
    try {
      const result = await uploadImageToR2(file);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEditForm((prev) =>
        prev ? { ...prev, seo_hero_image: result.url } : prev
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "사진 업로드에 실패했습니다.");
    } finally {
      setSeoHeroUploading(false);
    }
  }

  if (!embedded && !secret) {
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
          <p className="mt-1 text-sm text-muted">
            {naverEnabled
              ? "네이버 플레이스 등록 · 정보 수정 · 인증 추천 · 선택 삭제"
              : "정보 수정 · 인증 추천 on/off · 선택 삭제"}
          </p>
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
            onClick={() => void loadListings()}
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
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {naverEnabled ? (
        <section className="mb-8 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 shadow-[var(--card-shadow)]">
          <h2 className="text-base font-bold text-foreground">
            네이버 플레이스로 업체 등록
          </h2>
          <p className="mt-1 text-sm text-muted">
            업체명으로 검색하거나, 네이버지도 플레이스 URL(place/숫자)을
            붙여넣은 뒤 등록하세요. 등록 시 평점·블로그 리뷰(최대 5건)를 함께
            저장합니다.
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
      ) : null}

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
                <th className="px-5 py-3 font-medium">수정</th>
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
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => void openEdit(row)}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-gray-50"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      수정
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

      {editForm ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <form
            onSubmit={(e) => void saveEdit(e)}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">업체 정보 수정</h2>
              <button
                type="button"
                onClick={() => setEditForm(null)}
                className="rounded-lg p-1.5 text-muted hover:bg-gray-100"
                aria-label="닫기"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              {(
                [
                  ["name", "업체명", false],
                  ["address", "주소", false],
                  ["phone", "전화", false],
                  ["title_copy", "한 줄 소개", false],
                  ["region_big", "시/도", false],
                  ["region_small", "시/군/구", false],
                  ["logo_image", "대표 사진 URL", false],
                  ["naver_place_url", "네이버 지도 URL", false],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="block">
                  <span className="mb-1 block text-xs font-medium text-muted">
                    {label}
                  </span>
                  <input
                    value={editForm[key]}
                    onChange={(e) =>
                      setEditForm((prev) =>
                        prev ? { ...prev, [key]: e.target.value } : prev
                      )
                    }
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                  />
                </label>
              ))}
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted">
                  갤러리 사진 URL (한 줄에 하나)
                </span>
                <textarea
                  value={editForm.gallery_images}
                  onChange={(e) =>
                    setEditForm((prev) =>
                      prev ? { ...prev, gallery_images: e.target.value } : prev
                    )
                  }
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted">
                  분양 안내 문구
                </span>
                <textarea
                  value={editForm.service_info}
                  onChange={(e) =>
                    setEditForm((prev) =>
                      prev ? { ...prev, service_info: e.target.value } : prev
                    )
                  }
                  rows={4}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted">
                  홈페이지 URL
                </span>
                <p className="mb-2 text-[11px] leading-relaxed text-muted">
                  SEO 상단 「홈페이지」 버튼 링크입니다. 비우면 사이트 내 업체
                  상세로 이동합니다.
                </p>
                <input
                  value={editForm.homepage_url}
                  onChange={(e) =>
                    setEditForm((prev) =>
                      prev ? { ...prev, homepage_url: e.target.value } : prev
                    )
                  }
                  placeholder="https://..."
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                />
              </label>
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-3.5">
                <p className="mb-1 text-xs font-semibold text-foreground">
                  SEO 상세 히어로 사진
                </p>
                <p className="mb-3 text-[11px] leading-relaxed text-muted">
                  「3대 안심 공약」 바로 위에 둥근 테두리로 표시됩니다. 사진 위에
                  반투명 색을 얹고, 두 줄 문구를 올릴 수 있습니다.
                </p>
                <label className="mb-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-indigo-200 bg-white py-5">
                  <Upload className="mb-1.5 h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    {seoHeroUploading ? "업로드 중…" : "클릭해서 사진 등록"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={seoHeroUploading}
                    onChange={(e) =>
                      void handleSeoHeroUpload(e.target.files?.[0] ?? null)
                    }
                  />
                </label>
                <div className="mb-3 grid gap-2 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-muted">
                      첫째 줄 (큰 글씨)
                    </span>
                    <input
                      value={editForm.seo_hero_line1}
                      onChange={(e) =>
                        setEditForm((prev) =>
                          prev
                            ? { ...prev, seo_hero_line1: e.target.value }
                            : prev
                        )
                      }
                      placeholder="무료분양이라더니, 결국 결제창엔 80만 원이 찍혔나요?"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-muted">
                      둘째 줄 (작은 글씨)
                    </span>
                    <input
                      value={editForm.seo_hero_line2}
                      onChange={(e) =>
                        setEditForm((prev) =>
                          prev
                            ? { ...prev, seo_hero_line2: e.target.value }
                            : prev
                        )
                      }
                      placeholder="오케이독은 100% 투명한 정찰제로 승부합니다."
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                    />
                  </label>
                </div>
                <label className="mb-3 flex items-center gap-3">
                  <span className="text-xs font-medium text-muted">
                    오버레이 색상
                  </span>
                  <input
                    type="color"
                    value={
                      /^#[0-9a-fA-F]{6}$/.test(editForm.seo_hero_overlay)
                        ? editForm.seo_hero_overlay
                        : DEFAULT_SEO_HERO_OVERLAY
                    }
                    onChange={(e) =>
                      setEditForm((prev) =>
                        prev
                          ? { ...prev, seo_hero_overlay: e.target.value }
                          : prev
                      )
                    }
                    className="h-9 w-12 cursor-pointer rounded-lg border border-gray-200 bg-white p-1"
                  />
                  <div className="flex gap-1.5">
                    {["#312e81", "#111827", "#064e3b", "#4c1d13"].map(
                      (color) => (
                        <button
                          key={color}
                          type="button"
                          aria-label={`오버레이 ${color}`}
                          onClick={() =>
                            setEditForm((prev) =>
                              prev ? { ...prev, seo_hero_overlay: color } : prev
                            )
                          }
                          className="h-7 w-7 rounded-full border border-white shadow ring-1 ring-black/10"
                          style={{ backgroundColor: color }}
                        />
                      )
                    )}
                  </div>
                </label>
                {editForm.seo_hero_image ? (
                  <div>
                    <SeoHeroBanner
                      imageUrl={editForm.seo_hero_image}
                      overlayColor={editForm.seo_hero_overlay}
                      line1={editForm.seo_hero_line1}
                      line2={editForm.seo_hero_line2}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setEditForm((prev) =>
                          prev ? { ...prev, seo_hero_image: "" } : prev
                        )
                      }
                      className="mt-2 text-xs font-medium text-muted hover:text-red-600"
                    >
                      사진 삭제
                    </button>
                  </div>
                ) : null}
              </div>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted">
                  SEO 페이지 상세설명 등록
                </span>
                <p className="mb-2 text-[11px] leading-relaxed text-muted">
                  지역 SEO 상단 「인증 추천」 영역에 표시됩니다. HTML 또는 일반
                  글(줄바꿈) 모두 가능합니다. 비우면 기존처럼 간단한 카드만
                  나갑니다.
                </p>
                <textarea
                  value={editForm.seo_detail_html}
                  onChange={(e) =>
                    setEditForm((prev) =>
                      prev
                        ? { ...prev, seo_detail_html: e.target.value }
                        : prev
                    )
                  }
                  rows={10}
                  placeholder={`예시:\n<h3>왜 이곳을 추천하나요?</h3>\n<p>상담·방문 전 확인하면 좋은 포인트...</p>\n<ul><li>건강·계약 체크</li><li>전화 상담 가능</li></ul>`}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 font-mono text-xs outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                />
              </label>
              {editForm.logo_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={editForm.logo_image}
                  alt="미리보기"
                  className="h-28 w-full rounded-xl object-cover"
                />
              ) : null}
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setEditForm(null)}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={editSaving}
                className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {editSaving ? "저장 중…" : "저장"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
