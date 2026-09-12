"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  bcsQuestions,
  bcsScaleLabels,
  computeBcs,
  type BcsAnswerId,
  type BcsScore,
  type PetSpecies,
} from "@/lib/tools/bcs";
import { Callout, Pill, SpeciesToggle, ToolHeroImage } from "@/components/tools/ToolUi";

type Answers = Partial<Record<"ribs" | "waist" | "belly", BcsAnswerId>>;

const COLOR_MAP = {
  sky: {
    card: "from-sky-500 via-cyan-600 to-blue-700",
    chip: "bg-sky-100 text-sky-800",
    soft: "bg-sky-50 text-sky-950",
  },
  emerald: {
    card: "from-emerald-500 via-teal-600 to-green-700",
    chip: "bg-emerald-100 text-emerald-800",
    soft: "bg-emerald-50 text-emerald-950",
  },
  amber: {
    card: "from-amber-400 via-orange-500 to-amber-600",
    chip: "bg-amber-100 text-amber-900",
    soft: "bg-amber-50 text-amber-950",
  },
  orange: {
    card: "from-orange-500 via-orange-600 to-rose-600",
    chip: "bg-orange-100 text-orange-900",
    soft: "bg-orange-50 text-orange-950",
  },
  rose: {
    card: "from-rose-500 via-red-600 to-rose-800",
    chip: "bg-rose-100 text-rose-900",
    soft: "bg-rose-50 text-rose-950",
  },
} as const;

export function BcsChecker() {
  const [species, setSpecies] = useState<PetSpecies>("dog");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [name, setName] = useState("");
  const [showResult, setShowResult] = useState(false);

  const questions = useMemo(() => bcsQuestions(species), [species]);
  const current = questions[step];

  const result = useMemo(() => {
    const scores: BcsScore[] = [];
    for (const q of questions) {
      const id = answers[q.id];
      const opt = q.options.find((o) => o.id === id);
      if (opt) scores.push(opt.score);
    }
    if (scores.length < questions.length) return null;
    return computeBcs(scores, species);
  }, [answers, questions, species]);

  function pick(optionId: BcsAnswerId) {
    if (!current) return;
    const next = { ...answers, [current.id]: optionId };
    setAnswers(next);
    if (step < questions.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    setShowResult(true);
  }

  function resetAll() {
    setAnswers({});
    setStep(0);
    setShowResult(false);
  }

  function onSpeciesChange(v: PetSpecies) {
    setSpecies(v);
    resetAll();
  }

  const progress = ((showResult ? questions.length : step) / questions.length) * 100;
  const colors = result ? COLOR_MAP[result.color] : COLOR_MAP.emerald;

  return (
    <div className="space-y-6">
      <ToolHeroImage
        src={
          species === "dog"
            ? "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1200&q=80&auto=format&fit=crop"
            : "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1200&q=80&auto=format&fit=crop"
        }
        alt={species === "dog" ? "건강한 강아지" : "건강한 고양이"}
        badge="갈비 · 허리 · 배 라인 3문항"
      />

      <SpeciesToggle value={species} onChange={onSpeciesChange} />

      {!showResult ? (
        <div className="rounded-2xl bg-white p-5 shadow-[var(--card-shadow)] sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold tracking-wide text-primary">
              BCS 체크 {step + 1}/{questions.length}
            </p>
            <p className="text-xs text-muted">약 30초 · 재미로도 OK</p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-300"
              style={{ width: `${Math.max(8, progress)}%` }}
            />
          </div>

          <h2 className="mt-6 text-lg font-black text-foreground sm:text-xl">
            {current?.title}
          </h2>
          <p className="mt-2 text-sm text-muted">{current?.hint}</p>

          <div className="mt-5 space-y-2">
            {current?.options.map((opt) => {
              const selected = answers[current.id] === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => pick(opt.id)}
                  className={`w-full rounded-2xl border px-4 py-3.5 text-left transition ${
                    selected
                      ? "border-emerald-500 bg-emerald-50 shadow-sm"
                      : "border-gray-200 bg-gray-50 hover:border-emerald-300 hover:bg-white"
                  }`}
                >
                  <span className="block text-sm font-bold text-foreground">
                    {opt.label}
                  </span>
                  <span className="mt-1 block text-[12px] text-muted">
                    {opt.detail}
                  </span>
                </button>
              );
            })}
          </div>

          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="mt-4 text-sm font-semibold text-muted hover:text-foreground"
            >
              ← 이전 문항
            </button>
          ) : null}

          <label className="mt-6 block">
            <span className="text-sm font-bold">
              이름{" "}
              <span className="font-normal text-muted">(결과 카드용, 선택)</span>
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 초코, 나비"
              className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-primary focus:bg-white"
            />
          </label>
        </div>
      ) : result ? (
        <div className="space-y-4">
          <div
            className={`overflow-hidden rounded-2xl bg-gradient-to-br ${colors.card} p-6 text-white shadow-[var(--card-shadow-hover)] sm:p-8`}
          >
            <Pill color="gray">유아독존 BCS CARD</Pill>
            <p className="mt-4 text-sm text-white/80">
              {name.trim() ? (
                <>
                  <strong className="text-white">{name.trim()}</strong>의 비만도
                </>
              ) : (
                "우리 아이 비만도"
              )}
            </p>
            <p className="mt-2 flex flex-wrap items-end gap-2">
              <span className="text-6xl font-black tracking-tight">
                {result.score}
              </span>
              <span className="mb-2 text-lg font-bold">/ 9단계</span>
              <span className="mb-3 text-3xl">{result.emoji}</span>
            </p>
            <p className="text-xl font-black">{result.nickname}</p>
            <p className="mt-3 inline-flex rounded-full bg-white/20 px-3 py-1 text-sm font-semibold backdrop-blur">
              5단계 요약 · {result.stage5Label} ({result.stage5}/5)
            </p>
            <p className="mt-4 text-sm leading-relaxed text-white/90">
              {result.summary}
            </p>
            <p className="mt-8 text-[11px] tracking-widest text-white/50">
              YOURDOGZONE · CARE TOOLS
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-[var(--card-shadow)]">
            <p className="text-sm font-bold">9점 척도에서 내 위치</p>
            <div className="mt-3 flex gap-1">
              {bcsScaleLabels().map((item) => (
                <div
                  key={item.score}
                  title={item.label}
                  className={`h-3 flex-1 rounded-full ${
                    item.score === result.score
                      ? "bg-emerald-500 ring-2 ring-emerald-500 ring-offset-2"
                      : item.score < 4
                        ? "bg-sky-200"
                        : item.score <= 5
                          ? "bg-emerald-200"
                          : item.score <= 7
                            ? "bg-amber-300"
                            : "bg-rose-300"
                  }`}
                />
              ))}
            </div>
            <p className={`mt-3 rounded-xl px-3 py-2 text-sm ${colors.soft}`}>
              <strong>{result.score}점</strong> ·{" "}
              {bcsScaleLabels().find((x) => x.score === result.score)?.label}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-[var(--card-shadow)]">
            <p className="text-sm font-bold text-foreground">맞춤 관리 가이드</p>
            <ul className="mt-3 space-y-2">
              {result.tips.map((tip) => (
                <li
                  key={tip}
                  className={`flex gap-2 rounded-xl px-3 py-2.5 text-sm ${colors.soft}`}
                >
                  <span className="font-bold text-emerald-600">✓</span>
                  {tip}
                </li>
              ))}
            </ul>
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[13px] text-amber-950">
              <strong className="text-amber-800">주의 · </strong>
              {result.caution}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/tools/feeding"
              className="flex-1 rounded-xl bg-orange-50 py-3 text-center text-sm font-bold text-orange-700 hover:bg-orange-100"
            >
              급여량 계산기로 이어가기
            </Link>
            <button
              type="button"
              onClick={resetAll}
              className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold hover:bg-gray-50"
            >
              다시 진단
            </button>
          </div>
        </div>
      ) : null}

      <Callout tone="info" title="이 진단은 참고용이에요">
        수의학에서 쓰는 <strong>BCS 1~9점</strong>을 갈비·허리·배 라인으로
        쉽게 풀어 봤습니다. 품종·털 길이·임신·부종에 따라 달라질 수 있으니,
        걱정되면 동물병원에서 체중·촉진을 함께 확인하세요.
      </Callout>
    </div>
  );
}
