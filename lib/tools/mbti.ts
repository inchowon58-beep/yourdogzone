import type { PetSpecies } from "@/lib/tools/feeding";
import {
  MBTI_QUESTIONS as DOG_QUESTIONS,
  resolveMbtiType,
  type MbtiQuestion,
  type MbtiType,
} from "@/lib/tools/mbti-dog";
import {
  CAT_MBTI_QUESTIONS,
  resolveCatMbtiType,
} from "@/lib/tools/mbti-cat";

export type { MbtiQuestion, MbtiType };

export function getMbtiQuestions(species: PetSpecies): MbtiQuestion[] {
  return species === "cat" ? CAT_MBTI_QUESTIONS : DOG_QUESTIONS;
}

export function resolvePetMbti(
  species: PetSpecies,
  answers: Array<"E" | "I" | "S" | "N" | "T" | "F" | "J" | "P">
): MbtiType {
  return species === "cat"
    ? resolveCatMbtiType(answers)
    : resolveMbtiType(answers);
}

export function mbtiBrandLabel(species: PetSpecies): string {
  return species === "cat" ? "냥BTI" : "멍BTI";
}
