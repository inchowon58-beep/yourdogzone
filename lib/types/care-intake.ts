export type CareSpecies = "dog" | "cat";

export type CareChipType = "none" | "external" | "internal" | "both" | "unknown";

export type MatchingHours = 12 | 24 | 36 | 48;

export const MATCHING_HOUR_OPTIONS: MatchingHours[] = [12, 24, 36, 48];

export type CareIntakeStatus =
  | "pending_deposit"
  | "deposit_confirmed"
  | "pending_review"
  | "matching"
  | "matching_select"
  | "matched"
  | "expired"
  | "cancelled";

/** 매칭 완료 후 안심 딜리버리 진행 상태 */
export type CareDeliveryStatus =
  | "none"
  | "deposit_pending"
  | "assigning"
  | "ready_to_depart"
  | "completed"
  | "photo_requested";

export type CareIntakeApplication = {
  id: number | string;
  species: CareSpecies;
  photo_urls: string[];
  breed: string;
  pet_name: string;
  weight_kg: number | null;
  age_text: string | null;
  gender: string | null;
  neutered: boolean | null;
  vaccinated: boolean | null;
  chip_type: CareChipType | string | null;
  medical_history: string | null;
  current_illness: string | null;
  personality: string | null;
  surrender_reason: string | null;
  preferred_region: string | null;
  excluded_shelters: string[];
  notes: string | null;
  guardian_name: string;
  guardian_phone: string;
  guardian_address: string;
  portal_password_hash: string;
  matching_hours: MatchingHours;
  status: CareIntakeStatus;
  deposit_amount: number | null;
  deposit_confirmed_at: string | null;
  approved_at: string | null;
  matching_ends_at: string | null;
  selection_ends_at: string | null;
  bidding_closed_at: string | null;
  matched_bid_id: string | null;
  /** 안심 딜리버리 */
  delivery_status: CareDeliveryStatus;
  delivery_requested_at: string | null;
  delivery_deposit_confirmed_at: string | null;
  /** 입소 취소 시 무료분양 목록 노출 */
  cancelled_at: string | null;
  list_on_free_adoption: boolean;
  created_at: string;
  updated_at: string;
};

/** 무료분양 공개 상세 (보호자 개인정보 제외) */
export type CareFreeAdoptionPublic = {
  id: string;
  species: CareSpecies;
  photo_urls: string[];
  breed: string;
  pet_name: string;
  weight_kg: number | null;
  age_text: string | null;
  gender: string | null;
  neutered: boolean | null;
  vaccinated: boolean | null;
  chip_type: CareChipType | string | null;
  medical_history: string | null;
  current_illness: string | null;
  personality: string | null;
  preferred_region: string | null;
  cancelled_at: string | null;
};

export type CareIntakeInsert = {
  species: CareSpecies;
  photo_urls: string[];
  breed: string;
  pet_name: string;
  weight_kg?: number | null;
  age_text?: string | null;
  gender?: string | null;
  neutered?: boolean | null;
  vaccinated?: boolean | null;
  chip_type?: CareChipType | string | null;
  medical_history?: string | null;
  current_illness?: string | null;
  personality?: string | null;
  surrender_reason?: string | null;
  preferred_region?: string | null;
  excluded_shelters?: string[];
  notes?: string | null;
  guardian_name: string;
  guardian_phone: string;
  guardian_address: string;
  portal_password: string;
  matching_hours: MatchingHours;
};

export type CareIntakePublicItem = {
  id: string;
  species: CareSpecies;
  breed: string;
  pet_name?: string | null;
  photo_url: string | null;
  photo_locked: boolean;
  participant_count: number;
  remaining_ms: number | null;
  phase: "matching" | "matching_select" | "other";
  status?: CareIntakeStatus;
  status_label?: string;
  my_bid_amount: number | null;
  preferred_region: string | null;
  age_text: string | null;
  weight_kg: number | null;
  bid_excluded: boolean;
  can_bid: boolean;
};

export type CareApplicantBidView = {
  id: string;
  amount: number;
  shelter_name: string;
  shelter_phone: string;
  revealed: boolean;
};

export const CARE_INTAKE_STATUS_LABEL: Record<CareIntakeStatus, string> = {
  pending_deposit: "입금 대기",
  deposit_confirmed: "입금 확인",
  pending_review: "심사 대기",
  matching: "매칭 대기 중",
  matching_select: "매칭 선택 대기",
  matched: "매칭 완료",
  expired: "기간 만료",
  cancelled: "취소",
};

export const CARE_DELIVERY_STATUS_LABEL: Record<CareDeliveryStatus, string> = {
  none: "미신청",
  deposit_pending: "딜리버리 입금 대기",
  assigning: "담당자 배정중",
  ready_to_depart: "출발대기중",
  completed: "입소완료",
  photo_requested: "입소사진 요청됨",
};

export const CARE_DELIVERY_STATUS_OPTIONS: CareDeliveryStatus[] = [
  "none",
  "deposit_pending",
  "assigning",
  "ready_to_depart",
  "completed",
  "photo_requested",
];

/** 안심 딜리버리 입금 계좌 (환경변수로 덮어쓰기 가능) */
export function getCareDeliveryBankInfo() {
  return {
    bank: process.env.CARE_DELIVERY_BANK_NAME?.trim() || "국민은행",
    account: process.env.CARE_DELIVERY_ACCOUNT?.trim() || "000000-00-000000",
    holder: process.env.CARE_DELIVERY_HOLDER?.trim() || "유아독존",
    note:
      process.env.CARE_DELIVERY_NOTE?.trim() ||
      "입금자명은 보호자 성함과 동일하게 해 주세요. 입금 확인 후 담당자 배정·연락이 진행됩니다.",
  };
}

export const CARE_CHIP_LABEL: Record<CareChipType, string> = {
  none: "없음",
  external: "외장형",
  internal: "내장형",
  both: "외장형+내장형",
  unknown: "모름",
};

/** 제외 보호소 이름 파싱 (쉼표·줄바꿈·/ 구분) */
export function parseExcludedShelters(raw: string | string[] | null | undefined): string[] {
  if (Array.isArray(raw)) {
    return raw.map((s) => String(s).trim()).filter(Boolean);
  }
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(/[,/\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isShelterNameExcluded(
  shelterName: string,
  excluded: string[] | null | undefined
): boolean {
  if (!excluded || excluded.length === 0) return false;
  const norm = (s: string) => s.replace(/\s+/g, "").toLowerCase();
  const name = norm(shelterName);
  if (!name) return false;
  return excluded.some((ex) => {
    const e = norm(ex);
    return Boolean(e) && (name.includes(e) || e.includes(name));
  });
}
