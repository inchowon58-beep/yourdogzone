import "server-only";

import { getAcademies } from "@/lib/academy/queries";
import type { Academy } from "@/lib/types/academy";

/** 전국 인증추천(is_premium) 학원 풀 */
export async function getAllPremiumAcademies(): Promise<Academy[]> {
  return (await getAcademies()).filter((a) => a.is_premium);
}
