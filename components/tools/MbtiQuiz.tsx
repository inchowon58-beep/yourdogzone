"use client";

import { useMemo, useState } from "react";
import type { PetSpecies } from "@/lib/tools/feeding";
import {
  getMbtiQuestions,
  mbtiBrandLabel,
  resolvePetMbti,
} from "@/lib/tools/mbti";
import type { MbtiQuestion } from "@/lib/tools/mbti-dog";
import { Callout, Pill, SpeciesToggle, ToolHeroImage } from "@/components/tools/ToolUi";

type Answer = MbtiQuestion["optionA"]["value"] | MbtiQuestion["optionB"]["value"];

export function MbtiQuiz() {
  const [species, setSpecies] = useState<PetSpecies>("dog");
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);

  const questions = getMbtiQuestions(species);
  const brand = mbtiBrandLabel(species);
  const done = answers.length === questions.length;
  const result = useMemo(
    () => (done ? resolvePetMbti(species, answers) : null),
    [done, answers, species]
  );
  const current = questions[index];
  const progress = started ? Math.min(answers.length, questions.length) : 0;

  function resetAll(next?: PetSpecies) {
    if (next) setSpecies(next);
    setStarted(false);
    setIndex(0);
    setAnswers([]);
  }

  function pick(value: Answer) {
    const next = [...answers.slice(0, index), value];
    setAnswers(next);
    if (index < questions.length - 1) setIndex(index + 1);
  }

  return (
    <div className="space-y-6">
      <ToolHeroImage
        src={
          species === "dog"
            ? "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=1200&q=80&auto=format&fit=crop"
            : "https://images.unsplash.com/photo-1511044568932-338cba0ad803?w=1200&q=80&auto=format&fit=crop"
        }
        alt={species === "dog" ? "즐거운 강아지" : "눈빛 좋은 고양이"}
        badge={`${brand} · 12문항`}
      />

      {!started && (
        <SpeciesToggle
          value={species}
          onChange={(v) => resetAll(v)}
        />
      )}

      {!started && (
        <div className="rounded-2xl bg-white p-6 text-center shadow-[var(--card-shadow)] sm:p-8">
          <Pill color="violet">{brand}</Pill>
          <h2 className="mt-4 text-xl font-black text-foreground">
            우리 아이 성격, 추측 말고 패턴으로
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            사교성·감각·감정·생활리듬 4축으로 읽어{" "}
            <strong className="text-violet-700">돌봄 팁·놀이 아이디어</strong>까지
            제안합니다. 재미 + 실전 가이드용이에요.
          </p>
          <button
            type="button"
            onClick={() => setStarted(true)}
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-violet-600 to-primary py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-600/25 sm:w-auto sm:px-12"
          >
            {brand} 시작하기
          </button>
        </div>
      )}

      {started && result && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-gradient-to-br from-violet-600 via-primary to-indigo-700 p-6 text-white shadow-[var(--card-shadow-hover)] sm:p-8">
            <p className="text-xs font-bold tracking-widest text-white/60">
              유아독존 {brand}
            </p>
            <p className="mt-3 inline-flex rounded-full bg-white/20 px-3 py-1 text-sm font-bold">
              {result.code}
            </p>
            <h2 className="mt-3 text-3xl font-black">{result.title}</h2>
            <p className="mt-2 text-sm text-white/90">{result.subtitle}</p>
            <p className="mt-5 text-sm leading-relaxed text-white/95">
              {result.summary}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {result.traits.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white p-5 shadow-[var(--card-shadow)]">
              <p className="text-sm font-bold text-violet-700">돌봄 포인트</p>
              <ul className="mt-3 space-y-2 text-sm text-foreground">
                {result.careTips.map((t) => (
                  <li key={t} className="rounded-xl bg-violet-50 px-3 py-2">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-[var(--card-shadow)]">
              <p className="text-sm font-bold text-emerald-700">추천 놀이</p>
              <ul className="mt-3 space-y-2 text-sm text-foreground">
                {result.playIdeas.map((t) => (
                  <li key={t} className="rounded-xl bg-emerald-50 px-3 py-2">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <button
            type="button"
            onClick={() => resetAll()}
            className="w-full rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold hover:bg-gray-50"
          >
            다시 하기
          </button>
          <Callout tone="info" title="참고">
            성격 테스트는 의료 진단이 아닙니다. 행동 문제가 심하면 수의사·훈련
            전문가 상담을 권합니다.
          </Callout>
        </div>
      )}

      {started && !result && current && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-primary">
              {progress} / {questions.length}
            </span>
            <div className="h-2 w-40 overflow-hidden rounded-full bg-violet-100 sm:w-56">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-primary transition-all"
                style={{ width: `${(progress / questions.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-[var(--card-shadow)] sm:p-6">
            <Pill color="violet">Q{current.id}</Pill>
            <p className="mt-3 text-lg font-bold leading-snug text-foreground">
              {current.text}
            </p>
            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={() => pick(current.optionA.value)}
                className="w-full rounded-xl border-2 border-transparent bg-violet-50 px-4 py-4 text-left text-sm font-semibold text-violet-950 transition hover:border-violet-300 hover:bg-violet-100"
              >
                {current.optionA.label}
              </button>
              <button
                type="button"
                onClick={() => pick(current.optionB.value)}
                className="w-full rounded-xl border-2 border-transparent bg-primary/5 px-4 py-4 text-left text-sm font-semibold text-foreground transition hover:border-primary/30 hover:bg-primary/10"
              >
                {current.optionB.label}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
