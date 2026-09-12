export type DreamAnimal =
  | "dog"
  | "cat"
  | "rabbit"
  | "hamster"
  | "turtle"
  | "bird"
  | "fish"
  | "hedgehog"
  | "other";

export type DreamOmen = "길몽" | "흉몽" | "심리몽" | "길흉혼재";

export type DreamMood = "설렘" | "불안" | "슬픔" | "평온" | "그리움";

export type DreamSituationId =
  | "hug"
  | "runaway"
  | "hurt"
  | "talk"
  | "fly"
  | "dead"
  | "bite"
  | "cry"
  | "play"
  | "lost"
  | "birth"
  | "eat"
  | "bath"
  | "chase"
  | "kiss";

export type DreamArticle = {
  slug: string;
  animal: DreamAnimal;
  situationId: DreamSituationId;
  /** SEO H1 */
  title: string;
  /** 메타 description */
  description: string;
  keywords: string[];
  omen: DreamOmen;
  summary: string;
  psychology: string;
  situations: { title: string; body: string }[];
  careTip: string;
  relatedSlugs: string[];
};

export type DreamInterpretInput = {
  animal: DreamAnimal;
  situationId: DreamSituationId | "custom";
  customText: string;
  mood: DreamMood | null;
  petName: string;
};

export type DreamInterpretResult = {
  title: string;
  omen: DreamOmen;
  meaning: string;
  comment: string;
  matchedSlug: string | null;
};
