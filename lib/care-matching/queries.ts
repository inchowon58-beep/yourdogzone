import "server-only";

import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { hashPortalPassword, verifyPortalPassword } from "@/lib/care-matching/password";
import {
  applyMatchingExpiry,
  isOpenForPublicList,
  matchingEndsAtFrom,
  computeRemainingMs,
  selectionEndsAtFrom,
} from "@/lib/care-matching/matching-logic";
import {
  countBidsInList,
  getBidById,
  listAllShelterBids,
  listBidAmountsForApplicant,
} from "@/lib/care-matching/bid-queries";
import {
  listApprovedShelterPartners,
} from "@/lib/care-matching/partner-queries";
import { notifyAllApprovedPartners } from "@/lib/care-matching/notification-queries";
import { createPresignedPutObject } from "@/lib/upload/presign";
import { getPublicBaseUrl } from "@/lib/upload/r2-server";
import { completeR2Uploads } from "@/lib/upload/r2-mirror-core";
import type {
  CareApplicantBidView,
  CareDeliveryStatus,
  CareFreeAdoptionPublic,
  CareIntakeApplication,
  CareIntakeInsert,
  CareIntakePublicItem,
  CareIntakeStatus,
  MatchingHours,
} from "@/lib/types/care-intake";
import {
  CARE_INTAKE_STATUS_LABEL,
  isShelterNameExcluded,
  MATCHING_HOUR_OPTIONS,
  parseExcludedShelters,
} from "@/lib/types/care-intake";
import { getShelterPartnerById } from "@/lib/care-matching/partner-queries";

const INDEX_KEY = "care-intake/index.json";
const LOCAL_FILE = path.join(
  process.cwd(),
  "data",
  "care-intake-applications.json"
);

type IndexPayload = {
  updatedAt: string;
  applications: CareIntakeApplication[];
};

function indexPublicUrl(): string {
  return `${getPublicBaseUrl()}/${INDEX_KEY}`;
}

function sortByNewest(list: CareIntakeApplication[]): CareIntakeApplication[] {
  return [...list].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function migrateApplication(raw: Record<string, unknown>): CareIntakeApplication {
  const app = raw as unknown as CareIntakeApplication;
  const deliveryRaw = (app as { delivery_status?: string }).delivery_status;
  const delivery_status: CareDeliveryStatus =
    deliveryRaw === "deposit_pending" ||
    deliveryRaw === "assigning" ||
    deliveryRaw === "ready_to_depart" ||
    deliveryRaw === "completed" ||
    deliveryRaw === "photo_requested"
      ? deliveryRaw
      : "none";

  return {
    ...app,
    portal_password_hash:
      typeof app.portal_password_hash === "string"
        ? app.portal_password_hash
        : "",
    matching_hours: MATCHING_HOUR_OPTIONS.includes(
      app.matching_hours as MatchingHours
    )
      ? (app.matching_hours as MatchingHours)
      : 24,
    excluded_shelters: parseExcludedShelters(
      (app as { excluded_shelters?: string[] | string }).excluded_shelters
    ),
    approved_at: app.approved_at ?? null,
    matching_ends_at: app.matching_ends_at ?? null,
    selection_ends_at: app.selection_ends_at ?? null,
    bidding_closed_at: app.bidding_closed_at ?? null,
    matched_bid_id: app.matched_bid_id ?? null,
    delivery_status,
    delivery_requested_at: app.delivery_requested_at ?? null,
    delivery_deposit_confirmed_at: app.delivery_deposit_confirmed_at ?? null,
    cancelled_at: app.cancelled_at ?? null,
    list_on_free_adoption: Boolean(app.list_on_free_adoption),
  };
}

async function readLocal(): Promise<CareIntakeApplication[]> {
  try {
    const raw = await readFile(LOCAL_FILE, "utf8");
    const data = JSON.parse(raw) as IndexPayload;
    return Array.isArray(data.applications)
      ? sortByNewest(data.applications.map((a) => migrateApplication(a as unknown as Record<string, unknown>)))
      : [];
  } catch {
    return [];
  }
}

async function writeLocal(applications: CareIntakeApplication[]): Promise<void> {
  await mkdir(path.dirname(LOCAL_FILE), { recursive: true });
  const payload: IndexPayload = {
    updatedAt: new Date().toISOString(),
    applications: sortByNewest(applications),
  };
  await writeFile(LOCAL_FILE, JSON.stringify(payload, null, 2), "utf8");
}

async function fetchFromR2(options?: {
  noCache?: boolean;
}): Promise<CareIntakeApplication[]> {
  try {
    const res = await fetch(indexPublicUrl(), {
      ...(options?.noCache
        ? { cache: "no-store" as const }
        : { next: { revalidate: 30 } }),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as IndexPayload;
    return Array.isArray(data.applications)
      ? sortByNewest(
          data.applications.map((a) =>
            migrateApplication(a as unknown as Record<string, unknown>)
          )
        )
      : [];
  } catch {
    return [];
  }
}

async function loadAllRaw(options?: {
  noCache?: boolean;
}): Promise<CareIntakeApplication[]> {
  const fromR2 = await fetchFromR2({ noCache: options?.noCache ?? true });
  if (fromR2.length > 0) return fromR2;
  return readLocal();
}

async function processExpiryAndSave(
  list: CareIntakeApplication[]
): Promise<CareIntakeApplication[]> {
  let changed = false;
  const next = list.map((app) => {
    const updated = applyMatchingExpiry(app);
    if (updated !== app) changed = true;
    return updated;
  });
  if (changed) {
    await saveAll(next);
  }
  return next;
}

async function loadAll(options?: {
  noCache?: boolean;
}): Promise<CareIntakeApplication[]> {
  const raw = await loadAllRaw(options);
  return processExpiryAndSave(raw);
}

/** 공개 ISR용 — R2 fetch 캐시, 만료는 메모리만 적용(저장 없음) */
async function loadAllForPublic(): Promise<CareIntakeApplication[]> {
  const raw = await loadAllRaw({ noCache: false });
  return raw.map((app) => applyMatchingExpiry(app));
}

async function saveAll(
  applications: CareIntakeApplication[]
): Promise<{ ok: true } | { error: string }> {
  const sorted = sortByNewest(applications);
  const payload: IndexPayload = {
    updatedAt: new Date().toISOString(),
    applications: sorted,
  };
  const body = JSON.stringify(payload, null, 2);

  try {
    await writeLocal(sorted);
  } catch {
    // read-only FS
  }

  const presign = await createPresignedPutObject(INDEX_KEY, "application/json");
  if ("error" in presign) {
    if (process.env.VERCEL) {
      return { error: presign.error };
    }
    return { ok: true };
  }

  try {
    await completeR2Uploads([
      {
        uploadUrl: presign.uploadUrl,
        contentType: presign.contentType,
        body,
      },
    ]);
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "R2 저장 실패";
    return { error: msg };
  }
}

function buildRow(
  input: CareIntakeInsert,
  now: string
): CareIntakeApplication {
  return {
    id: randomUUID(),
    species: input.species,
    photo_urls: input.photo_urls,
    breed: input.breed.trim(),
    pet_name: input.pet_name.trim(),
    weight_kg: input.weight_kg ?? null,
    age_text: input.age_text?.trim() || null,
    gender: input.gender?.trim() || null,
    neutered: input.neutered ?? null,
    vaccinated: input.vaccinated ?? null,
    chip_type: input.chip_type ?? null,
    medical_history: input.medical_history?.trim() || null,
    current_illness: input.current_illness?.trim() || null,
    personality: input.personality?.trim() || null,
    surrender_reason: input.surrender_reason?.trim() || null,
    preferred_region: input.preferred_region?.trim() || null,
    excluded_shelters: parseExcludedShelters(input.excluded_shelters),
    notes: input.notes?.trim() || null,
    guardian_name: input.guardian_name.trim(),
    guardian_phone: input.guardian_phone.trim(),
    guardian_address: input.guardian_address.trim(),
    portal_password_hash: hashPortalPassword(input.portal_password),
    matching_hours: input.matching_hours,
    status: "pending_deposit",
    deposit_amount: 50000,
    deposit_confirmed_at: null,
    approved_at: null,
    matching_ends_at: null,
    selection_ends_at: null,
    bidding_closed_at: null,
    matched_bid_id: null,
    delivery_status: "none",
    delivery_requested_at: null,
    delivery_deposit_confirmed_at: null,
    cancelled_at: null,
    list_on_free_adoption: false,
    created_at: now,
    updated_at: now,
  };
}

export async function insertCareIntake(
  input: CareIntakeInsert
): Promise<{ data: CareIntakeApplication | null; error: string | null }> {
  const now = new Date().toISOString();
  const row = buildRow(input, now);
  const list = await loadAll({ noCache: true });
  list.unshift(row);

  const saved = await saveAll(list);
  if ("error" in saved) {
    return { data: null, error: saved.error };
  }
  return { data: row, error: null };
}

export async function listCareIntakes(): Promise<CareIntakeApplication[]> {
  return loadAll({ noCache: true });
}

export async function getCareIntakeById(
  id: string | number
): Promise<CareIntakeApplication | null> {
  const list = await loadAll({ noCache: true });
  return list.find((a) => String(a.id) === String(id)) ?? null;
}

export async function updateCareIntakeStatus(
  id: number | string,
  status: CareIntakeStatus
): Promise<{ data: CareIntakeApplication | null; error: string | null }> {
  const now = new Date().toISOString();
  const list = await loadAll({ noCache: true });
  const idx = list.findIndex((a) => String(a.id) === String(id));
  if (idx < 0) return { data: null, error: "신청을 찾을 수 없습니다." };

  list[idx] = {
    ...list[idx],
    status,
    updated_at: now,
    deposit_confirmed_at:
      status === "deposit_confirmed" ? now : list[idx].deposit_confirmed_at,
    cancelled_at:
      status === "cancelled"
        ? list[idx].cancelled_at ?? now
        : list[idx].cancelled_at,
    list_on_free_adoption:
      status === "cancelled" ? true : list[idx].list_on_free_adoption,
  };

  const saved = await saveAll(list);
  if ("error" in saved) {
    return { data: null, error: saved.error };
  }
  return { data: list[idx], error: null };
}

export async function approveCareIntake(
  id: number | string
): Promise<{ data: CareIntakeApplication | null; error: string | null }> {
  const now = new Date();
  const nowIso = now.toISOString();
  const list = await loadAll({ noCache: true });
  const idx = list.findIndex((a) => String(a.id) === String(id));
  if (idx < 0) return { data: null, error: "신청을 찾을 수 없습니다." };

  const app = list[idx];
  if (
    !["pending_deposit", "deposit_confirmed", "pending_review"].includes(
      app.status
    )
  ) {
    return {
      data: null,
      error: "이미 매칭이 시작되었거나 승인할 수 없는 상태입니다.",
    };
  }

  const matching_ends_at = matchingEndsAtFrom(app.matching_hours, now);
  list[idx] = {
    ...app,
    status: "matching",
    deposit_confirmed_at: app.deposit_confirmed_at ?? nowIso,
    approved_at: nowIso,
    matching_ends_at,
    selection_ends_at: null,
    bidding_closed_at: null,
    updated_at: nowIso,
  };

  const saved = await saveAll(list);
  if ("error" in saved) {
    return { data: null, error: saved.error };
  }

  const partners = await listApprovedShelterPartners();
  if (partners.length > 0) {
    await notifyAllApprovedPartners({
      type: "new_matching",
      title: "새 안심입소 매칭이 시작되었습니다",
      body: `${app.species === "dog" ? "강아지" : "고양이"} · ${app.breed} 신청이 매칭 대기 중입니다. 돌봄비용을 제안해 주세요.`,
      application_id: String(app.id),
      partnerIds: partners.map((p) => p.id),
    });
  }

  return { data: list[idx], error: null };
}

export async function closeCareIntakeBidding(
  id: string | number,
  guardianPhone: string,
  password: string
): Promise<{ data: CareIntakeApplication | null; error: string | null }> {
  const list = await loadAll({ noCache: true });
  const idx = list.findIndex((a) => String(a.id) === String(id));
  if (idx < 0) return { data: null, error: "신청을 찾을 수 없습니다." };

  const app = list[idx];
  if (
    normalizePhone(app.guardian_phone) !== normalizePhone(guardianPhone) ||
    !verifyPortalPassword(password, app.portal_password_hash)
  ) {
    return { data: null, error: "연락처 또는 비밀번호가 올바르지 않습니다." };
  }

  if (app.status !== "matching") {
    return { data: null, error: "현재 매칭 대기 상태가 아닙니다." };
  }

  const now = new Date();
  const nowIso = now.toISOString();
  list[idx] = {
    ...app,
    status: "matching_select",
    bidding_closed_at: nowIso,
    selection_ends_at: selectionEndsAtFrom(now),
    updated_at: nowIso,
  };

  const saved = await saveAll(list);
  if ("error" in saved) return { data: null, error: saved.error };
  return { data: list[idx], error: null };
}

export async function selectCareIntakeBid(
  id: string | number,
  guardianPhone: string,
  password: string,
  bidId: string
): Promise<{ data: CareIntakeApplication | null; error: string | null }> {
  const list = await loadAll({ noCache: true });
  const idx = list.findIndex((a) => String(a.id) === String(id));
  if (idx < 0) return { data: null, error: "신청을 찾을 수 없습니다." };

  const app = list[idx];
  if (
    normalizePhone(app.guardian_phone) !== normalizePhone(guardianPhone) ||
    !verifyPortalPassword(password, app.portal_password_hash)
  ) {
    return { data: null, error: "연락처 또는 비밀번호가 올바르지 않습니다." };
  }

  if (app.status !== "matching_select") {
    return { data: null, error: "매칭 선택 단계가 아닙니다." };
  }

  const bid = await getBidById(bidId);
  if (!bid || String(bid.application_id) !== String(app.id)) {
    return { data: null, error: "유효하지 않은 제안입니다." };
  }

  const nowIso = new Date().toISOString();
  list[idx] = {
    ...app,
    status: "matched",
    matched_bid_id: bid.id,
    updated_at: nowIso,
  };

  const saved = await saveAll(list);
  if ("error" in saved) return { data: null, error: saved.error };
  return { data: list[idx], error: null };
}

export async function lookupApplicantIntake(
  guardianPhone: string,
  password: string
): Promise<{
  data: {
    application: Omit<CareIntakeApplication, "portal_password_hash">;
    bids: CareApplicantBidView[];
  } | null;
  error: string | null;
}> {
  const normalized = normalizePhone(guardianPhone);
  const list = await loadAll({ noCache: true });
  const app = list.find(
    (a) => normalizePhone(a.guardian_phone) === normalized
  );
  if (!app) {
    return { data: null, error: "해당 연락처의 신청 내역이 없습니다." };
  }
  if (!verifyPortalPassword(password, app.portal_password_hash)) {
    return { data: null, error: "비밀번호가 올바르지 않습니다." };
  }

  const { portal_password_hash: _, ...safe } = app;
  const rawBids = await listBidAmountsForApplicant(String(app.id));
  const bids: CareApplicantBidView[] = await Promise.all(
    rawBids.map(async (bid) => {
      const revealed =
        app.status === "matched" &&
        String(app.matched_bid_id) === String(bid.id);
      if (!revealed) {
        return {
          id: bid.id,
          amount: bid.amount,
          shelter_name: "*****",
          shelter_phone: "*****",
          revealed: false,
        };
      }
      const partner = await getShelterPartnerById(bid.partner_id);
      return {
        id: bid.id,
        amount: bid.amount,
        shelter_name: partner?.shelter_name ?? "*****",
        shelter_phone: partner?.phone ?? "*****",
        revealed: true,
      };
    })
  );

  return { data: { application: safe, bids }, error: null };
}

export async function listOpenCareIntakes(options?: {
  page?: number;
  pageSize?: number;
  partnerId?: string | null;
  partnerName?: string | null;
  isAdmin?: boolean;
  canViewPhotos?: boolean;
  /** 홈·공개 SSR용: R2 fetch 캐시, 만료 저장 없음 */
  useCache?: boolean;
}): Promise<{
  items: CareIntakePublicItem[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const page = Math.max(1, options?.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, options?.pageSize ?? 10));
  const partnerId = options?.partnerId ?? null;
  const partnerName = options?.partnerName ?? null;
  const isAdmin = options?.isAdmin ?? false;
  const canViewPhotos = options?.canViewPhotos ?? Boolean(partnerId || isAdmin);
  const useCache = Boolean(options?.useCache);

  const list = useCache
    ? await loadAllForPublic()
    : await loadAll({ noCache: true });
  const visible = isAdmin
    ? list.filter((app) => app.status !== "cancelled")
    : list.filter(isOpenForPublicList);
  const total = visible.length;
  const slice = visible.slice((page - 1) * pageSize, page * pageSize);

  const allBids = await listAllShelterBids({ noCache: !useCache });

  const items: CareIntakePublicItem[] = slice.map((app) => {
    const participant_count = countBidsInList(allBids, String(app.id));
    let my_bid_amount: number | null = null;
    if (partnerId) {
      const myBid = allBids.find(
        (b) =>
          b.partner_id === partnerId &&
          String(b.application_id) === String(app.id)
      );
      my_bid_amount = myBid?.amount ?? null;
    }

    const phase =
      app.status === "matching_select"
        ? "matching_select"
        : app.status === "matching"
          ? "matching"
          : "other";

    const bid_excluded = Boolean(
      partnerName &&
        isShelterNameExcluded(partnerName, app.excluded_shelters)
    );
    // 보호소 파트너 세션이 있으면 관리자 동시 로그인 여부와 관계없이 입찰 가능
    const can_bid =
      Boolean(partnerId) &&
      phase === "matching" &&
      !bid_excluded &&
      my_bid_amount == null;

    return {
      id: String(app.id),
      species: app.species,
      breed: app.breed,
      pet_name: isAdmin ? app.pet_name : null,
      photo_url: app.photo_urls[0] ?? null,
      photo_locked: !canViewPhotos,
      participant_count,
      remaining_ms: computeRemainingMs(app),
      phase,
      status: isAdmin ? app.status : undefined,
      status_label: isAdmin
        ? CARE_INTAKE_STATUS_LABEL[app.status]
        : undefined,
      my_bid_amount,
      preferred_region: null,
      age_text: app.age_text,
      weight_kg: app.weight_kg,
      bid_excluded,
      can_bid,
    };
  });

  return { items, total, page, pageSize };
}

function verifyApplicant(
  app: CareIntakeApplication,
  guardianPhone: string,
  password: string
): string | null {
  if (
    normalizePhone(app.guardian_phone) !== normalizePhone(guardianPhone) ||
    !verifyPortalPassword(password, app.portal_password_hash)
  ) {
    return "연락처 또는 비밀번호가 올바르지 않습니다.";
  }
  return null;
}

function toFreeAdoptionPublic(app: CareIntakeApplication): CareFreeAdoptionPublic {
  return {
    id: String(app.id),
    species: app.species,
    photo_urls: app.photo_urls,
    breed: app.breed,
    pet_name: app.pet_name,
    weight_kg: app.weight_kg,
    age_text: app.age_text,
    gender: app.gender,
    neutered: app.neutered,
    vaccinated: app.vaccinated,
    chip_type: app.chip_type,
    medical_history: app.medical_history,
    current_illness: app.current_illness,
    personality: app.personality,
    preferred_region: app.preferred_region,
    cancelled_at: app.cancelled_at,
  };
}

/** 입소 취소 → 무료분양 목록에 우선 노출 */
export async function cancelCareIntakeByApplicant(
  id: string | number,
  guardianPhone: string,
  password: string
): Promise<{ data: CareIntakeApplication | null; error: string | null }> {
  const list = await loadAll({ noCache: true });
  const idx = list.findIndex((a) => String(a.id) === String(id));
  if (idx < 0) return { data: null, error: "신청을 찾을 수 없습니다." };

  const app = list[idx];
  const authErr = verifyApplicant(app, guardianPhone, password);
  if (authErr) return { data: null, error: authErr };

  if (app.status === "cancelled") {
    return { data: null, error: "이미 취소된 신청입니다." };
  }
  if (
    app.delivery_status === "completed" ||
    app.delivery_status === "photo_requested"
  ) {
    return {
      data: null,
      error: "입소가 완료된 건은 취소할 수 없습니다. 고객센터로 문의해 주세요.",
    };
  }

  const nowIso = new Date().toISOString();
  list[idx] = {
    ...app,
    status: "cancelled",
    cancelled_at: nowIso,
    list_on_free_adoption: true,
    updated_at: nowIso,
  };

  const saved = await saveAll(list);
  if ("error" in saved) return { data: null, error: saved.error };
  return { data: list[idx], error: null };
}

/** 매칭 완료 후 안심 딜리버리 신청 */
export async function requestCareDelivery(
  id: string | number,
  guardianPhone: string,
  password: string
): Promise<{ data: CareIntakeApplication | null; error: string | null }> {
  const list = await loadAll({ noCache: true });
  const idx = list.findIndex((a) => String(a.id) === String(id));
  if (idx < 0) return { data: null, error: "신청을 찾을 수 없습니다." };

  const app = list[idx];
  const authErr = verifyApplicant(app, guardianPhone, password);
  if (authErr) return { data: null, error: authErr };

  if (app.status !== "matched") {
    return { data: null, error: "매칭 완료 후에만 딜리버리를 신청할 수 있습니다." };
  }
  if (app.delivery_status !== "none") {
    return { data: null, error: "이미 딜리버리가 신청되었습니다." };
  }

  const nowIso = new Date().toISOString();
  list[idx] = {
    ...app,
    delivery_status: "deposit_pending",
    delivery_requested_at: nowIso,
    updated_at: nowIso,
  };

  const saved = await saveAll(list);
  if ("error" in saved) return { data: null, error: saved.error };
  return { data: list[idx], error: null };
}

/** 입소완료 후 입소사진 요청 */
export async function requestCareIntakePhoto(
  id: string | number,
  guardianPhone: string,
  password: string
): Promise<{ data: CareIntakeApplication | null; error: string | null }> {
  const list = await loadAll({ noCache: true });
  const idx = list.findIndex((a) => String(a.id) === String(id));
  if (idx < 0) return { data: null, error: "신청을 찾을 수 없습니다." };

  const app = list[idx];
  const authErr = verifyApplicant(app, guardianPhone, password);
  if (authErr) return { data: null, error: authErr };

  if (app.delivery_status !== "completed") {
    return { data: null, error: "입소완료 상태에서만 사진을 요청할 수 있습니다." };
  }

  const nowIso = new Date().toISOString();
  list[idx] = {
    ...app,
    delivery_status: "photo_requested",
    updated_at: nowIso,
  };

  const saved = await saveAll(list);
  if ("error" in saved) return { data: null, error: saved.error };
  return { data: list[idx], error: null };
}

export async function updateCareDeliveryStatus(
  id: number | string,
  deliveryStatus: CareDeliveryStatus
): Promise<{ data: CareIntakeApplication | null; error: string | null }> {
  const nowIso = new Date().toISOString();
  const list = await loadAll({ noCache: true });
  const idx = list.findIndex((a) => String(a.id) === String(id));
  if (idx < 0) return { data: null, error: "신청을 찾을 수 없습니다." };

  const app = list[idx];
  list[idx] = {
    ...app,
    delivery_status: deliveryStatus,
    delivery_deposit_confirmed_at:
      deliveryStatus === "assigning" && !app.delivery_deposit_confirmed_at
        ? nowIso
        : app.delivery_deposit_confirmed_at,
    delivery_requested_at:
      deliveryStatus !== "none" && !app.delivery_requested_at
        ? nowIso
        : app.delivery_requested_at,
    updated_at: nowIso,
  };

  const saved = await saveAll(list);
  if ("error" in saved) return { data: null, error: saved.error };
  return { data: list[idx], error: null };
}

/** 무료분양 홈·목록용 — 최근 취소분 우선 (공개 캐시 읽기) */
export async function listFreeAdoptionFromCancelled(
  limit = 24
): Promise<CareFreeAdoptionPublic[]> {
  const list = await loadAllForPublic();
  return list
    .filter((a) => a.status === "cancelled" && a.list_on_free_adoption)
    .sort((a, b) => {
      const ta = new Date(a.cancelled_at ?? a.updated_at).getTime();
      const tb = new Date(b.cancelled_at ?? b.updated_at).getTime();
      return tb - ta;
    })
    .slice(0, limit)
    .map(toFreeAdoptionPublic);
}

export async function getFreeAdoptionById(
  id: string
): Promise<CareFreeAdoptionPublic | null> {
  const app = await getCareIntakeById(id);
  if (
    !app ||
    app.status !== "cancelled" ||
    !app.list_on_free_adoption
  ) {
    return null;
  }
  return toFreeAdoptionPublic(app);
}
