export type HealthSpecies =
  | "dog"
  | "cat"
  | "reptile"
  | "bird"
  | "small"
  | "fish";

export type GuideKind = "disease" | "symptom" | "prevention";

export type Urgency = "monitor" | "soon" | "emergency";

export type BodySystem =
  | "digestive"
  | "skin"
  | "joint"
  | "heart"
  | "urinary"
  | "respiratory"
  | "dental"
  | "neuro"
  | "eye"
  | "endocrine"
  | "infectious"
  | "parasite"
  | "metabolic"
  | "behavior"
  | "environment"
  | "general";

export type HealthGuide = {
  slug: string;
  title: string;
  species: HealthSpecies[];
  kind: GuideKind;
  system: BodySystem;
  urgency: Urgency;
  summary: string;
  signals: string[];
  causes: string[];
  homeCare: string[];
  seeVetWhen: string[];
  prevention: string[];
  relatedSlugs?: string[];
  keywords: string[];
};

export const SPECIES_LABEL: Record<HealthSpecies, string> = {
  dog: "강아지",
  cat: "고양이",
  reptile: "파충류",
  bird: "새",
  small: "소동물",
  fish: "관상어",
};

export const KIND_LABEL: Record<GuideKind, string> = {
  disease: "질병 가이드",
  symptom: "증상 가이드",
  prevention: "예방 가이드",
};

export const SYSTEM_LABEL: Record<BodySystem, string> = {
  digestive: "소화기",
  skin: "피부·모질",
  joint: "관절·근골격",
  heart: "심장·순환",
  urinary: "비뇨기",
  respiratory: "호흡기",
  dental: "구강·치아",
  neuro: "신경·인지",
  eye: "눈",
  endocrine: "내분비",
  infectious: "감염",
  parasite: "기생충",
  metabolic: "대사·영양",
  behavior: "행동",
  environment: "환경·독성",
  general: "종합",
};

export const URGENCY_LABEL: Record<Urgency, string> = {
  monitor: "관찰",
  soon: "빠른 진료",
  emergency: "응급 가능",
};

export const URGENCY_STYLE: Record<
  Urgency,
  { badge: string; soft: string; text: string }
> = {
  monitor: {
    badge: "bg-emerald-600",
    soft: "bg-emerald-50",
    text: "text-emerald-800",
  },
  soon: {
    badge: "bg-amber-500",
    soft: "bg-amber-50",
    text: "text-amber-900",
  },
  emergency: {
    badge: "bg-red-600",
    soft: "bg-red-50",
    text: "text-red-800",
  },
};
