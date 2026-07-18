/**
 * 유아독존 급여량 계산 — 수의영양 RER/MER 기반 참고값
 * (제품·개체·질환에 따라 실제 급여량은 달라질 수 있음)
 */

export type PetSpecies = "dog" | "cat";
export type LifeStage = "young" | "adult" | "senior";
export type BodyCondition = "thin" | "ideal" | "overweight";

/** 건사료 평균 열량 (kcal/g) */
export const KCAL_PER_GRAM: Record<PetSpecies, number> = {
  dog: 3.7,
  cat: 4.0,
};

/** 생애 단계 × 종 계수 (MER = RER × factor) */
const LIFE_STAGE_FACTOR: Record<PetSpecies, Record<LifeStage, number>> = {
  dog: { young: 2.5, adult: 1.6, senior: 1.3 },
  cat: { young: 2.5, adult: 1.2, senior: 1.1 },
};

const BODY_FACTOR: Record<BodyCondition, number> = {
  thin: 1.15,
  ideal: 1,
  overweight: 0.85,
};

export function calcRer(weightKg: number): number {
  if (weightKg <= 0) return 0;
  return 70 * weightKg ** 0.75;
}

export function calcMer(
  weightKg: number,
  species: PetSpecies,
  lifeStage: LifeStage,
  body: BodyCondition,
  underFourMonths = false
): number {
  const rer = calcRer(weightKg);
  let factor =
    LIFE_STAGE_FACTOR[species][lifeStage] * BODY_FACTOR[body];
  if (lifeStage === "young" && underFourMonths) {
    factor = Math.max(factor, species === "dog" ? 3.0 : 2.8);
  }
  return rer * factor;
}

export function mealsPerDay(species: PetSpecies, lifeStage: LifeStage): number {
  if (lifeStage === "young") return species === "dog" ? 3 : 3;
  return 2;
}

export function calcDailyFeedingGrams(
  weightKg: number,
  species: PetSpecies,
  lifeStage: LifeStage,
  body: BodyCondition,
  underFourMonths = false
): {
  rer: number;
  mer: number;
  gramsPerDay: number;
  gramsPerMeal: number;
  meals: number;
  kcalPerGram: number;
} {
  const kcalPerGram = KCAL_PER_GRAM[species];
  const rer = calcRer(weightKg);
  const mer = calcMer(weightKg, species, lifeStage, body, underFourMonths);
  const gramsPerDay = mer / kcalPerGram;
  const meals = mealsPerDay(species, lifeStage);
  return {
    rer: Math.round(rer),
    mer: Math.round(mer),
    gramsPerDay: Math.round(gramsPerDay),
    gramsPerMeal: Math.round(gramsPerDay / meals),
    meals,
    kcalPerGram,
  };
}

export const LIFE_STAGE_COPY: Record<
  PetSpecies,
  Record<LifeStage, { label: string; hint: string }>
> = {
  dog: {
    young: { label: "성장기", hint: "12개월 미만" },
    adult: { label: "성년기", hint: "약 1~7세" },
    senior: { label: "시니어", hint: "대략 7세+" },
  },
  cat: {
    young: { label: "성장기", hint: "12개월 미만" },
    adult: { label: "성년기", hint: "약 1~10세" },
    senior: { label: "시니어", hint: "대략 11세+" },
  },
};
