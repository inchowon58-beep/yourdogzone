import "server-only";

import { randomUUID } from "crypto";
import path from "path";
import { createR2JsonStore } from "@/lib/care-matching/r2-json-store";
import type {
  SiteSideBanner,
  SiteSideBannerInput,
} from "@/lib/types/site-banner";

type BannerIndex = {
  updatedAt: string;
  banners: SiteSideBanner[];
};

const store = createR2JsonStore<BannerIndex>({
  indexKey: "site-side-banners/index.json",
  localFile: path.join(process.cwd(), "data", "site-side-banners.json"),
  arrayKey: "banners",
});

function sortBanners(list: SiteSideBanner[]): SiteSideBanner[] {
  return [...list].sort((a, b) => a.sort_order - b.sort_order);
}

export async function listSiteSideBanners(options?: {
  enabledOnly?: boolean;
}): Promise<SiteSideBanner[]> {
  const data = await store.load(true);
  const all = Array.isArray(data.banners) ? sortBanners(data.banners) : [];
  if (options?.enabledOnly) {
    return all.filter((b) => b.enabled && b.image_url);
  }
  return all;
}

export async function createSiteSideBanner(
  input: SiteSideBannerInput
): Promise<{ data: SiteSideBanner | null; error: string | null }> {
  const title = input.title.trim();
  const image_url = input.image_url.trim();
  const href = input.href.trim() || "/";
  if (!title || !image_url) {
    return { data: null, error: "제목과 이미지를 입력해 주세요." };
  }
  if (!["left", "right"].includes(input.slot)) {
    return { data: null, error: "좌/우 위치를 선택해 주세요." };
  }

  const now = new Date().toISOString();
  const data = await store.load(true);
  const banners = Array.isArray(data.banners) ? [...data.banners] : [];
  const banner: SiteSideBanner = {
    id: randomUUID(),
    slot: input.slot,
    title,
    image_url,
    href,
    enabled: input.enabled ?? true,
    sort_order: input.sort_order ?? banners.length,
    created_at: now,
    updated_at: now,
  };
  banners.push(banner);
  const saved = await store.save({ ...data, banners: sortBanners(banners) });
  if ("error" in saved) return { data: null, error: saved.error };
  return { data: banner, error: null };
}

export async function updateSiteSideBanner(
  id: string,
  patch: Partial<SiteSideBannerInput> & { enabled?: boolean }
): Promise<{ data: SiteSideBanner | null; error: string | null }> {
  const data = await store.load(true);
  const banners = Array.isArray(data.banners) ? [...data.banners] : [];
  const idx = banners.findIndex((b) => b.id === id);
  if (idx < 0) return { data: null, error: "배너를 찾을 수 없습니다." };

  const prev = banners[idx];
  banners[idx] = {
    ...prev,
    slot: patch.slot ?? prev.slot,
    title: patch.title?.trim() || prev.title,
    image_url: patch.image_url?.trim() || prev.image_url,
    href: patch.href?.trim() || prev.href,
    enabled: typeof patch.enabled === "boolean" ? patch.enabled : prev.enabled,
    sort_order:
      typeof patch.sort_order === "number" ? patch.sort_order : prev.sort_order,
    updated_at: new Date().toISOString(),
  };

  const saved = await store.save({ ...data, banners: sortBanners(banners) });
  if ("error" in saved) return { data: null, error: saved.error };
  return { data: banners[idx], error: null };
}

export async function deleteSiteSideBanner(
  id: string
): Promise<{ ok: true } | { error: string }> {
  const data = await store.load(true);
  const banners = Array.isArray(data.banners) ? data.banners : [];
  const next = banners.filter((b) => b.id !== id);
  if (next.length === banners.length) return { error: "배너를 찾을 수 없습니다." };
  const saved = await store.save({ ...data, banners: sortBanners(next) });
  if ("error" in saved) return saved;
  return { ok: true };
}
