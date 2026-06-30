export function generateBreedSlug(nameKo: string, nameEn?: string): string {
  const fromEn = (nameEn || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  if (fromEn.length >= 2) return fromEn;

  const fromKo = nameKo
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9가-힣-]/g, "")
    .toLowerCase();

  return fromKo || `breed-${Date.now().toString(36)}`;
}

export function breedPageUrl(slug: string): string {
  return `https://www.yourdogzone.co.kr/dognose/${slug}`;
}
