import "server-only";

import { randomUUID } from "crypto";
import path from "path";
import { hashPortalPassword } from "@/lib/care-matching/password";
import { createR2JsonStore } from "@/lib/care-matching/r2-json-store";
import type {
  CareShelterPartner,
  CareShelterPartnerInsert,
  ShelterPartnerStatus,
} from "@/lib/types/care-shelter-partner";

type PartnerIndex = {
  updatedAt: string;
  partners: CareShelterPartner[];
};

const store = createR2JsonStore<PartnerIndex>({
  indexKey: "care-shelter-partners/index.json",
  localFile: path.join(process.cwd(), "data", "care-shelter-partners.json"),
  arrayKey: "partners",
});

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export async function listShelterPartners(): Promise<CareShelterPartner[]> {
  const data = await store.load(true);
  return Array.isArray(data.partners) ? data.partners : [];
}

export async function listApprovedShelterPartners(): Promise<CareShelterPartner[]> {
  const all = await listShelterPartners();
  return all.filter((p) => p.status === "approved");
}

export async function getShelterPartnerById(
  id: string
): Promise<CareShelterPartner | null> {
  const all = await listShelterPartners();
  return all.find((p) => p.id === id) ?? null;
}

export async function getShelterPartnerByPhone(
  phone: string
): Promise<CareShelterPartner | null> {
  const normalized = normalizePhone(phone);
  const all = await listShelterPartners();
  return (
    all.find((p) => normalizePhone(p.phone) === normalized) ?? null
  );
}

export async function registerShelterPartner(
  input: CareShelterPartnerInsert
): Promise<{ data: CareShelterPartner | null; error: string | null }> {
  const shelter_name = input.shelter_name.trim();
  const contact_name = input.contact_name.trim();
  const phone = input.phone.trim();
  const email = input.email.trim();
  const address = input.address.trim();
  const password = input.password;

  if (
    !shelter_name ||
    !contact_name ||
    !phone ||
    !email ||
    !address ||
    password.length < 6
  ) {
    return {
      data: null,
      error: "필수 정보를 모두 입력하고 비밀번호는 6자 이상으로 설정해 주세요.",
    };
  }

  const existing = await getShelterPartnerByPhone(phone);
  if (existing) {
    return { data: null, error: "이미 등록된 연락처입니다." };
  }

  const now = new Date().toISOString();
  const partner: CareShelterPartner = {
    id: randomUUID(),
    shelter_name,
    contact_name,
    phone,
    email,
    address,
    password_hash: hashPortalPassword(password),
    status: "pending",
    created_at: now,
    updated_at: now,
  };

  const data = await store.load(true);
  const partners = Array.isArray(data.partners) ? [...data.partners] : [];
  partners.unshift(partner);
  const saved = await store.save({ ...data, partners });
  if ("error" in saved) return { data: null, error: saved.error };
  return { data: partner, error: null };
}

export async function verifyShelterPartnerLogin(
  phone: string,
  password: string
): Promise<CareShelterPartner | null> {
  const partner = await getShelterPartnerByPhone(phone);
  if (!partner) return null;
  const { verifyPortalPassword } = await import("@/lib/care-matching/password");
  if (!verifyPortalPassword(password, partner.password_hash)) return null;
  return partner;
}

export async function updateShelterPartnerStatus(
  id: string,
  status: ShelterPartnerStatus
): Promise<{ data: CareShelterPartner | null; error: string | null }> {
  const data = await store.load(true);
  const partners = Array.isArray(data.partners) ? [...data.partners] : [];
  const idx = partners.findIndex((p) => p.id === id);
  if (idx < 0) return { data: null, error: "파트너를 찾을 수 없습니다." };
  const now = new Date().toISOString();
  partners[idx] = { ...partners[idx], status, updated_at: now };
  const saved = await store.save({ ...data, partners });
  if ("error" in saved) return { data: null, error: saved.error };
  return { data: partners[idx], error: null };
}

export function sanitizeShelterPartner(
  partner: CareShelterPartner
): Omit<CareShelterPartner, "password_hash"> {
  const { password_hash: _, ...rest } = partner;
  return rest;
}
