import { generateUniqueSlug } from "@/lib/slug/unique-id";

/** @deprecated name/region 인자는 더 이상 slug에 사용하지 않습니다. */
export function generateAcademySlug(
  _name?: string,
  _regionSmall?: string,
  _regionBig?: string
): string {
  return generateUniqueSlug("academy");
}
