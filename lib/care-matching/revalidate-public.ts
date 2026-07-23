import { revalidatePath } from "next/cache";

/** 홈·매칭 공개 목록·무료분양에 영향 주는 쓰기 후 호출 */
export function revalidateCareMatchingPublic(options?: {
  freeAdoptionId?: string | number;
}) {
  revalidatePath("/");
  revalidatePath("/care-matching");
  revalidatePath("/care-matching/list");
  if (options?.freeAdoptionId != null) {
    revalidatePath(`/free-adoption/${options.freeAdoptionId}`);
  }
}
