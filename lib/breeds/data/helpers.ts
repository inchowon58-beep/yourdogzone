import type { Breed, BreedKind, BreedSizeGroup } from "@/lib/types/breed";
import { BREED_SIZE_LABELS } from "@/lib/breeds/config";

const SEED_DATE = "2025-06-01T00:00:00.000Z";

type BreedSeedInput = {
  slug: string;
  name_ko: string;
  name_en: string;
  kind: BreedKind;
  size_group: BreedSizeGroup;
  origin: string;
  summary: string;
  history: string;
  personality: string;
  appearance: string;
  grooming: string;
  exercise: string;
  health: string;
  training: string;
  living: string;
  lifespan: string;
  weight: string;
  height: string;
  tags?: string[];
};

export function makeBreed(input: BreedSeedInput): Breed {
  return {
    ...input,
    size_label: BREED_SIZE_LABELS[input.size_group],
    hero_image: null,
    gallery_images: null,
    tags: input.tags ?? [],
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  };
}
