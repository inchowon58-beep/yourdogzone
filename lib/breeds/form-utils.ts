import { BREED_SIZE_LABELS } from "@/lib/breeds/config";
import { generateBreedSlug } from "@/lib/breeds/slug";
import type { Breed, BreedInsert } from "@/lib/types/breed";

export type BreedFormData = {
  name_ko: string;
  name_en: string;
  kind: Breed["kind"];
  size_group: Breed["size_group"];
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
  tags: string;
  hero_image: string;
  gallery_images: string[];
};

export const EMPTY_BREED_FORM: BreedFormData = {
  name_ko: "",
  name_en: "",
  kind: "purebred",
  size_group: "small",
  origin: "",
  summary: "",
  history: "",
  personality: "",
  appearance: "",
  grooming: "",
  exercise: "",
  health: "",
  training: "",
  living: "",
  lifespan: "",
  weight: "",
  height: "",
  tags: "",
  hero_image: "",
  gallery_images: [],
};

export function breedToFormData(breed: Breed): BreedFormData {
  return {
    name_ko: breed.name_ko,
    name_en: breed.name_en,
    kind: breed.kind,
    size_group: breed.size_group,
    origin: breed.origin,
    summary: breed.summary,
    history: breed.history,
    personality: breed.personality,
    appearance: breed.appearance,
    grooming: breed.grooming,
    exercise: breed.exercise,
    health: breed.health,
    training: breed.training,
    living: breed.living,
    lifespan: breed.lifespan,
    weight: breed.weight,
    height: breed.height,
    tags: breed.tags.join(", "),
    hero_image: breed.hero_image ?? "",
    gallery_images: breed.gallery_images ?? [],
  };
}

export function formDataToInsert(form: BreedFormData, slug?: string): BreedInsert {
  const resolvedSlug = slug ?? generateBreedSlug(form.name_ko, form.name_en);
  return {
    slug: resolvedSlug,
    name_ko: form.name_ko.trim(),
    name_en: form.name_en.trim() || form.name_ko.trim(),
    kind: form.kind,
    size_group: form.size_group,
    size_label: BREED_SIZE_LABELS[form.size_group],
    origin: form.origin.trim(),
    summary: form.summary.trim(),
    history: form.history.trim(),
    personality: form.personality.trim(),
    appearance: form.appearance.trim(),
    grooming: form.grooming.trim(),
    exercise: form.exercise.trim(),
    health: form.health.trim(),
    training: form.training.trim(),
    living: form.living.trim(),
    lifespan: form.lifespan.trim(),
    weight: form.weight.trim(),
    height: form.height.trim(),
    tags: form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    hero_image: form.hero_image.startsWith("http") ? form.hero_image : null,
    gallery_images: form.gallery_images.length ? form.gallery_images : null,
  };
}
