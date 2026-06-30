import { PUREBRED_SEEDS } from "@/lib/breeds/data/purebred";
import { DESIGNER_SEEDS } from "@/lib/breeds/data/designer";
import type { Breed } from "@/lib/types/breed";

export function getSeedBreeds(): Breed[] {
  return [...PUREBRED_SEEDS, ...DESIGNER_SEEDS];
}

export function getSeedBreedBySlug(slug: string): Breed | undefined {
  return getSeedBreeds().find((b) => b.slug === slug);
}
