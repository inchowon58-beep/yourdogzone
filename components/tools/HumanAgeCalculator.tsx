"use client";

import { useState } from "react";
import {
  ageStageLabel,
  ageStageTips,
  petAgeStage,
  toHumanAge,
  type DogSize,
  type PetSpecies,
} from "@/lib/tools/human-age";
import { Callout, Pill, SpeciesToggle, ToolHeroImage } from "@/components/tools/ToolUi";

const SIZE_OPTIONS: { id: DogSize; label: string; hint: string }[] = [
  { id: "small", label: "소형", hint: "대략 ~10kg" },
  { id: "medium", label: "중형", hint: "대략 10~25kg" },
  { id: "large", label: "대형", hint: "대략 25kg+" },
];

export function HumanAgeCalculator() {
  const [species, setSpecies] = useState<PetSpecies>("dog");
  const [size, setSize] = useState<DogSize>("small");
  const [years, setYears] = useState(3);
  const [name, setName] = useState("");
  const [showResult, setShowResult] = useState(false);

  const humanAge = toHumanAge(years, species, size);
  const stage = petAgeStage(years, species, size);
  const tips = ageStageTips(stage, species);

  return (
    <div className="space-y-6">
      <ToolHeroImage
        src={
          species === "dog"
            ? "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&q=80&auto=format&fit=crop"
            : "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=1200&q=80&auto=format&fit=crop"
        }
        alt={species === "dog" ? "뛰노는 강아지들" : "창가의 고양이"}
        badge="생애 단계 가이드 포함"
      />

      <SpeciesToggle value={species} onChange={setSpecies} />

      {!showResult ? (
        <div className="rounded-2xl bg-white p-5 shadow-[var(--card-shadow)] sm:p-6">
          {species === "dog" && (
            <>
              <p className="text-sm font-bold text-foreground">
                체구 크기{" "}
                <span className="font-normal text-muted">
                  — 클수록 시니어 진입이 빨라요
                </span>
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {SIZE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSize(opt.id)}
                    className={`rounded-xl px-2 py-3 text-center transition-all ${
                      size === opt.id
                        ? "bg-pink-600 text-white shadow-md shadow-pink-600/20"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    <span className="block text-sm font-bold">{opt.label}</span>
                    <span
                      className={`mt-0.5 block text-[11px] ${
                        size === opt.id ? "text-white/80" : "text-muted"
                      }`}
                    >
                      {opt.hint}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {species === "cat" && (
            <Callout tone="info" title="고양이 환산 안내">
              고양이는 체구보다 <strong className="text-primary">나이</strong>가
              핵심입니다. 1년≈15세, 2년≈24세, 이후 매년 약 4세씩 더해 참고합니다.
            </Callout>
          )}

          <div className={`${species === "dog" ? "mt-6" : "mt-4"}`}>
            <div className="flex items-end justify-between">
              <p className="text-sm font-bold">실제 나이</p>
              <p className="text-3xl font-black text-pink-600">
                {years % 1 === 0 ? years : years.toFixed(1)}
                <span className="ml-1 text-sm font-semibold text-muted">세</span>
              </p>
            </div>
            <input
              type="range"
              min={0.5}
              max={20}
              step={0.5}
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="mt-3 w-full accent-pink-600"
            />
          </div>

          <label className="mt-6 block">
            <span className="text-sm font-bold">
              이름 <span className="font-normal text-muted">(결과 카드용, 선택)</span>
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 초코, 나비"
              className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-primary focus:bg-white"
            />
          </label>

          <button
            type="button"
            onClick={() => setShowResult(true)}
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-pink-600 to-violet-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-pink-600/20 transition hover:opacity-95"
          >
            사람 나이로 환산하기
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-pink-600 via-rose-600 to-violet-700 p-6 text-white shadow-[var(--card-shadow-hover)] sm:p-8">
            <Pill color="violet">유아독존 AGE CARD</Pill>
            <p className="mt-4 text-sm text-white/80">
              {name.trim() ? (
                <>
                  <strong className="text-white">{name.trim()}</strong>의 사람 나이
                </>
              ) : (
                "우리 아이의 사람 나이"
              )}
            </p>
            <p className="mt-2 text-6xl font-black tracking-tight">
              {humanAge}
              <span className="ml-2 text-2xl font-bold">세</span>
            </p>
            <p className="mt-4 inline-flex rounded-full bg-white/20 px-3 py-1 text-sm font-semibold backdrop-blur">
              {ageStageLabel(stage)}
            </p>
            <p className="mt-8 text-[11px] tracking-widest text-white/50">
              YOURDOGZONE · CARE TOOLS
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-[var(--card-shadow)]">
            <p className="text-sm font-bold text-foreground">
              이 시기에 챙기면 좋은 것
            </p>
            <ul className="mt-3 space-y-2">
              {tips.map((tip) => (
                <li
                  key={tip}
                  className="flex gap-2 rounded-xl bg-violet-50 px-3 py-2.5 text-sm text-violet-950"
                >
                  <span className="font-bold text-violet-600">✓</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            onClick={() => setShowResult(false)}
            className="w-full rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold hover:bg-gray-50"
          >
            다시 계산
          </button>
        </div>
      )}

      <Callout tone="ok" title="참고 기준">
        강아지는 체구별 연간 가산(소형 +4 / 중형 +5 / 대형 +6, 2세 이후), 고양이는
        이후 +4를 사용합니다. <strong>품종·건강에 따라 개인차가 큽니다.</strong>
      </Callout>
    </div>
  );
}
