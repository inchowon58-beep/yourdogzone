export type BreedKind = "purebred" | "designer";

export type BreedSizeGroup = "toy" | "small" | "medium" | "large" | "giant";

export type Breed = {
  slug: string;
  name_ko: string;
  name_en: string;
  kind: BreedKind;
  size_group: BreedSizeGroup;
  size_label: string;
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
  hero_image: string | null;
  gallery_images: string[] | null;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type BreedInsert = Omit<Breed, "created_at" | "updated_at">;

export type BreedSummary = Pick<
  Breed,
  | "slug"
  | "name_ko"
  | "name_en"
  | "kind"
  | "size_group"
  | "size_label"
  | "summary"
  | "hero_image"
  | "tags"
>;
