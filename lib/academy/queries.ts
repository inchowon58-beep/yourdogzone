import { cache } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import {
  fetchAcademiesFromR2,
  fetchAcademyFromR2,
  loadLatestAcademyList,
  prepareAcademyPremiumUpdate,
  prepareAcademyR2Deletes,
  prepareAcademyR2Insert,
  type R2UploadTask,
} from "@/lib/academy/r2-store";
import {
  filterAcademies,
  getCachedAcademyIndex,
} from "@/lib/academy/academy-index";
import type { Academy, AcademyInsert } from "@/lib/types/academy";

export async function getAcademies(options?: {
  region?: string;
  query?: string;
}): Promise<Academy[]> {
  const supabase = createSupabaseClient();
  if (!supabase) {
    const index = await getCachedAcademyIndex();
    if (index.length > 0) return filterAcademies(index, options);
    return getMockAcademies(options);
  }

  let q = supabase
    .from("academy_list")
    .select("*")
    .order("is_premium", { ascending: false })
    .order("created_at", { ascending: false });

  if (options?.region && options.region !== "전체") {
    q = q.eq("region_big", options.region);
  }

  if (options?.query) {
    const term = `%${options.query}%`;
    q = q.or(
      `name.ilike.${term},region_small.ilike.${term},address.ilike.${term},title_copy.ilike.${term}`
    );
  }

  const { data, error } = await q;
  if (error || !data) return getMockAcademies(options);
  return data as Academy[];
}

export const getAcademyBySlug = cache(async (slug: string): Promise<Academy | null> => {
  const supabase = createSupabaseClient();
  if (!supabase) {
    const fromR2 = await fetchAcademyFromR2(slug);
    if (fromR2) return fromR2;
    const index = await getCachedAcademyIndex();
    return index.find((a) => a.slug === slug) ?? getMockAcademies().find((a) => a.slug === slug) ?? null;
  }

  const { data, error } = await supabase
    .from("academy_list")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return getMockAcademies().find((a) => a.slug === slug) ?? null;
  }
  return data as Academy;
});

export async function getAcademySlugs(): Promise<string[]> {
  const supabase = createSupabaseClient();
  if (!supabase) {
    const index = await getCachedAcademyIndex();
    if (index.length > 0) return index.map((a) => a.slug);
    return getMockAcademies().map((a) => a.slug);
  }

  const { data, error } = await supabase.from("academy_list").select("slug");
  if (error || !data) return getMockAcademies().map((a) => a.slug);
  return data.map((row) => row.slug);
}

export type InsertAcademyResult =
  | { data: Academy; error: null; uploads?: undefined }
  | { data: Academy; error: null; uploads: R2UploadTask[] }
  | { data: null; error: string; uploads?: undefined };

export async function insertAcademy(
  payload: AcademyInsert
): Promise<InsertAcademyResult> {
  const supabase = createSupabaseClient();
  if (!supabase) {
    const prepared = await prepareAcademyR2Insert(payload);
    if (prepared.error || !prepared.record) {
      return { data: null, error: prepared.error ?? "R2 저장 준비에 실패했습니다." };
    }
    return {
      data: prepared.record,
      error: null,
      uploads: prepared.uploads,
    };
  }

  const { data, error } = await supabase
    .from("academy_list")
    .insert(payload)
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as Academy, error: null };
}

export type SetPremiumResult =
  | { data: Academy; error: null; uploads?: undefined }
  | { data: Academy; error: null; uploads: R2UploadTask[] }
  | { data: null; error: string; uploads?: undefined };

export async function setAcademyPremium(
  slug: string,
  isPremium: boolean
): Promise<SetPremiumResult> {
  const supabase = createSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("academy_list")
      .update({ is_premium: isPremium })
      .eq("slug", slug)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as Academy, error: null };
  }

  const prepared = await prepareAcademyPremiumUpdate(slug, isPremium);
  if (prepared.error || !prepared.record) {
    return { data: null, error: prepared.error ?? "변경에 실패했습니다." };
  }

  return {
    data: prepared.record,
    error: null,
    uploads: prepared.uploads,
  };
}

export type DeleteAcademiesResult =
  | { ok: true; deleted: string[]; uploads?: undefined }
  | { ok: true; deleted: string[]; uploads: R2UploadTask[] }
  | { ok: false; error: string; deleted: string[] };

export async function deleteAcademies(
  slugs: string[]
): Promise<DeleteAcademiesResult> {
  const unique = [...new Set(slugs.map((s) => s.trim()).filter(Boolean))];
  if (unique.length === 0) {
    return { ok: false, error: "삭제할 slug가 필요합니다.", deleted: [] };
  }

  const supabase = createSupabaseClient();
  if (supabase) {
    const { error } = await supabase
      .from("academy_list")
      .delete()
      .in("slug", unique);

    if (error) {
      return { ok: false, error: error.message, deleted: [] };
    }

    return { ok: true, deleted: unique };
  }

  const prepared = await prepareAcademyR2Deletes(unique);
  if (prepared.error || !prepared.uploads) {
    return {
      ok: false,
      error: prepared.error ?? "삭제에 실패했습니다.",
      deleted: [],
    };
  }

  return {
    ok: true,
    deleted: prepared.deleted,
    uploads: prepared.uploads,
  };
}

function getMockAcademies(options?: {
  region?: string;
  query?: string;
}): Academy[] {
  const now = new Date().toISOString();
  const mocks: Academy[] = [
    {
      id: 1,
      slug: "gangnam-petbeauty",
      name: "강남펫뷰티아카데미",
      region_big: "서울",
      region_small: "강남구",
      title_copy: "강남 최고의 애견미용 자격증·취업 전문 학원",
      logo_image: null,
      academy_images: [],
      phone: "02-1234-5678",
      address: "서울특별시 강남구 테헤란로 123",
      curriculum: "자격증반, 취업반, 창업반, 원데이 클래스",
      tuition_info: "국비지원 가능 · 수강료 상담 시 10% 할인",
      kakao_url: null,
      is_premium: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 2,
      slug: "bundang-grooming",
      name: "분당그루밍스쿨",
      region_big: "경기",
      region_small: "분당구",
      title_copy: "분당 애견미용 실무 중심 교육",
      logo_image: null,
      academy_images: [],
      phone: "031-987-6543",
      address: "경기도 성남시 분당구 정자동 456",
      curriculum: "기초반, 심화반, 창업반",
      tuition_info: "분할 납부 가능 · 재수강 20% 할인",
      kakao_url: null,
      is_premium: false,
      created_at: now,
      updated_at: now,
    },
    {
      id: 3,
      slug: "haeundae-pet-school",
      name: "해운대펫스쿨",
      region_big: "부산",
      region_small: "해운대구",
      title_copy: "부산 해운대 애견미용 전문 교육",
      logo_image: null,
      academy_images: [],
      phone: "051-555-1234",
      address: "부산광역시 해운대구 우동 789",
      curriculum: "입문반, 자격증반, 창업반",
      tuition_info: "조기 등록 할인 진행 중",
      kakao_url: null,
      is_premium: false,
      created_at: now,
      updated_at: now,
    },
  ];

  return filterAcademies(mocks, options);
}