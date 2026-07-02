import "server-only";

import { filterPremiumAcademies, getCachedAcademyIndex } from "@/lib/academy/academy-index";
import type { Academy } from "@/lib/types/academy";

/** 전국 인증추천(is_premium) 학원 풀 — index 1회 */
export async function getAllPremiumAcademies(): Promise<Academy[]> {
  return filterPremiumAcademies(await getCachedAcademyIndex());
}
