"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  DREAM_ANIMAL_OPTIONS,
  DREAM_MOOD_OPTIONS,
  DREAM_SITUATION_OPTIONS,
} from "@/lib/dreams/catalog";
import type {
  DreamAnimal,
  DreamMood,
  DreamSituationId,
} from "@/lib/dreams/types";
import type { DreamLongform } from "@/lib/dreams/longform-types";
import { DreamLongformView } from "@/components/dreams/DreamLongformView";
import { Callout, Pill } from "@/components/tools/ToolUi";

type Phase = "form" | "loading" | "result";

export function DreamInterpreter() {
  const [phase, setPhase] = useState<Phase>("form");
  const [animal, setAnimal] = useState<DreamAnimal>("dog");
  const [situationId, setSituationId] = useState<DreamSituationId | "custom">(
    "fly"
  );
  const [customText, setCustomText] = useState("");
  const [mood, setMood] = useState<DreamMood | null>(null);
  const [petName, setPetName] = useState("");
  const [longform, setLongform] = useState<DreamLongform | null>(null);
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    if (situationId === "custom") return customText.trim().length >= 2;
    return true;
  }, [situationId, customText]);

  async function onSubmit() {
    if (!canSubmit) {
      setError("꿈속에서 무슨 일이 있었는지 적어 주세요.");
      return;
    }
    setError("");
    setWarning("");
    setPhase("loading");
    try {
      const res = await fetch("/api/dreams/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          animal,
          situationId,
          customText,
          mood,
          petName,
        }),
      });
      const data = (await res.json()) as {
        longform?: DreamLongform;
        warning?: string;
        error?: string;
      };
      if (!res.ok || !data.longform) {
        setError(data.error || "해몽을 불러오지 못했습니다.");
        setPhase("form");
        return;
      }
      setLongform(data.longform);
      setWarning(data.warning || "");
      setPhase("result");
    } catch {
      setError("네트워크 오류로 해몽에 실패했습니다.");
      setPhase("form");
    }
  }

  function reset() {
    setPhase("form");
    setLongform(null);
    setWarning("");
    setError("");
  }

  return (
    <div className="space-y-5">
      {phase === "form" ? (
        <div className="space-y-5 rounded-2xl border border-[#e8ddd4] bg-[#fbf7f3] p-5 shadow-[var(--card-shadow)] sm:p-6">
          <Pill color="violet">반려동물 꿈 해몽소</Pill>
          <h2 className="text-xl font-black text-[#2c2a3a]">
            어젯밤 꿈, 같이 읽어 볼까요?
          </h2>
          <p className="text-sm leading-relaxed text-[#6b6578]">
            동물·상황을 고르면 AI가 1,000자 이상의 전문 해몽 리포트를 작성해
            드려요.
          </p>

          <label className="block">
            <span className="text-sm font-bold text-[#2c2a3a]">
              아이 이름 (선택)
            </span>
            <input
              type="text"
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              placeholder="예: 뽀삐"
              className="mt-2 w-full rounded-2xl border border-[#e5dcd3] bg-white px-4 py-3.5 text-sm outline-none focus:border-[#c4a4a4]"
            />
          </label>

          <div>
            <p className="mb-2 text-sm font-bold text-[#2c2a3a]">동물 선택</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {DREAM_ANIMAL_OPTIONS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setAnimal(o.id)}
                  className={`rounded-2xl border px-3 py-3 text-left text-sm font-bold transition ${
                    animal === o.id
                      ? "border-[#b88a8a] bg-[#f3e6e6] text-[#5c3030]"
                      : "border-[#e5dcd3] bg-white text-[#2c2a3a]"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-bold text-[#2c2a3a]">주요 상황</p>
            <div className="grid gap-2">
              {DREAM_SITUATION_OPTIONS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setSituationId(o.id)}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    situationId === o.id
                      ? "border-[#7a8bb8] bg-[#eef1f8] shadow-sm"
                      : "border-[#e5dcd3] bg-white hover:border-[#c9d0e0]"
                  }`}
                >
                  <span className="block text-sm font-bold">{o.label}</span>
                  <span className="mt-0.5 block text-xs text-[#6b6578]">
                    {o.hint}
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSituationId("custom")}
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  situationId === "custom"
                    ? "border-[#7a8bb8] bg-[#eef1f8] shadow-sm"
                    : "border-[#e5dcd3] bg-white"
                }`}
              >
                <span className="block text-sm font-bold">직접 입력</span>
                <span className="mt-0.5 block text-xs text-[#6b6578]">
                  목록에 없는 장면
                </span>
              </button>
            </div>
          </div>

          {situationId === "custom" ? (
            <label className="block">
              <span className="text-sm font-bold text-[#2c2a3a]">
                꿈속에서 아이가 무엇을 하고 있었나요?
              </span>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                rows={3}
                placeholder="예: 무지개 다리를 건너가며 뒤돌아보았어요"
                className="mt-2 w-full resize-none rounded-2xl border border-[#e5dcd3] bg-white px-4 py-3.5 text-sm outline-none focus:border-[#c4a4a4]"
              />
            </label>
          ) : null}

          <div>
            <p className="mb-2 text-sm font-bold text-[#2c2a3a]">
              지금 마음은? (선택)
            </p>
            <div className="flex flex-wrap gap-2">
              {DREAM_MOOD_OPTIONS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMood(mood === m ? null : m)}
                  className={`rounded-full px-3.5 py-2 text-xs font-bold ${
                    mood === m
                      ? "bg-[#2c2a3a] text-white"
                      : "bg-white text-[#5c5668] ring-1 ring-[#e5dcd3]"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {error ? (
            <p className="text-sm font-semibold text-red-600">{error}</p>
          ) : null}

          <button
            type="button"
            onClick={() => void onSubmit()}
            className="w-full rounded-2xl bg-[#2c2a3a] py-4 text-base font-bold text-white shadow-md hover:bg-[#3d3a4f]"
          >
            해몽 결과 보기
          </button>
        </div>
      ) : null}

      {phase === "loading" ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[#e8ddd4] bg-[#fbf7f3] px-6 py-16">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#e8ddd4] border-t-[#b88a8a]" />
          <p className="mt-5 text-base font-black text-[#2c2a3a]">
            전문 해몽 리포트를 작성하는 중…
          </p>
          <p className="mt-2 max-w-sm text-center text-sm leading-relaxed text-[#6b6578]">
            상징·심리·케어 팁까지 길게 풀어 쓰는 중이에요. 보통 수 초~십수 초
            걸려요.
          </p>
        </div>
      ) : null}

      {phase === "result" && longform ? (
        <div className="space-y-4">
          {warning ? (
            <Callout tone="warn" title="안내">
              {warning}
            </Callout>
          ) : null}
          <DreamLongformView longform={longform} />

          <div className="grid gap-2 sm:grid-cols-2">
            <Link
              href="/tools/love-score"
              className="rounded-2xl bg-[#f3e6e6] px-4 py-4 text-center text-sm font-bold text-[#5c3030]"
            >
              우리 강아지 사랑 포인트도 확인해보기 →
            </Link>
            <Link
              href="/tools/petshop-curation"
              className="rounded-2xl bg-[#eef1f8] px-4 py-4 text-center text-sm font-bold text-[#2c3a5c]"
            >
              유아독존 안심 제휴처 · 펫샵선택도우미 →
            </Link>
          </div>

          <button
            type="button"
            onClick={reset}
            className="w-full rounded-2xl border border-[#e5dcd3] bg-white py-3 text-sm font-semibold"
          >
            다른 꿈 해몽하기
          </button>
        </div>
      ) : null}

      <Callout tone="info" title="참고해 주세요">
        꿈 해몽은 재미·위로용 해석입니다. 의학·행동 진단이 아니며, 아이 건강이
        걱정되면 수의사와 상담해 주세요.
      </Callout>
    </div>
  );
}
