import { NextResponse } from "next/server";
import { generateDreamLongformWithGemini } from "@/lib/ai/dream-gemini";
import {
  animalLabel,
  DREAM_ANIMAL_OPTIONS,
  DREAM_SITUATION_OPTIONS,
  situationLabel,
} from "@/lib/dreams/catalog";
import type { DreamAnimal, DreamSituationId } from "@/lib/dreams/types";
import { fallbackInteractiveLongform } from "@/lib/dreams/interactive-fallback";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Body = {
  animal?: DreamAnimal;
  situationId?: DreamSituationId | "custom";
  customText?: string;
  mood?: string | null;
  petName?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const animal = body.animal || "dog";
    if (!DREAM_ANIMAL_OPTIONS.some((o) => o.id === animal)) {
      return NextResponse.json({ error: "동물 선택이 올바르지 않습니다." }, { status: 400 });
    }

    const situationId = body.situationId || "custom";
    const isCustom = situationId === "custom";
    const sitLabel = isCustom
      ? body.customText?.trim() || "직접 입력한 꿈"
      : DREAM_SITUATION_OPTIONS.some((s) => s.id === situationId)
        ? situationLabel(situationId as DreamSituationId)
        : null;

    if (!sitLabel) {
      return NextResponse.json({ error: "꿈 상황을 선택해 주세요." }, { status: 400 });
    }
    if (isCustom && (body.customText?.trim().length || 0) < 2) {
      return NextResponse.json(
        { error: "꿈속에서 무슨 일이 있었는지 적어 주세요." },
        { status: 400 }
      );
    }

    const result = await generateDreamLongformWithGemini({
      animalLabel: animalLabel(animal),
      situationLabel: sitLabel,
      customText: body.customText,
      mood: body.mood,
      petName: body.petName,
    });

    if (result.ok) {
      return NextResponse.json({ longform: result.data });
    }

    console.error("[api/dreams/interpret]", result.error);
    const fallback = fallbackInteractiveLongform({
      animal,
      situationLabel: sitLabel,
      petName: body.petName,
      mood: body.mood,
      errorHint: result.error,
    });
    return NextResponse.json({
      longform: fallback,
      warning: "AI 해몽 생성에 실패해 기본 해석을 제공합니다.",
    });
  } catch (e) {
    console.error("[api/dreams/interpret]", e);
    return NextResponse.json(
      { error: "해몽 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
