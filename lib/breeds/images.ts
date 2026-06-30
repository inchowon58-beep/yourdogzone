import type { Breed } from "@/lib/types/breed";

export function getBreedOgImages(
  breed: Pick<Breed, "hero_image" | "gallery_images">,
  max = 3
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  const add = (url: string | null | undefined) => {
    if (!url || !url.startsWith("http") || seen.has(url)) return;
    seen.add(url);
    result.push(url);
  };

  add(breed.hero_image);
  if (Array.isArray(breed.gallery_images)) {
    for (const url of breed.gallery_images) add(url);
  }

  return result.slice(0, max);
}
