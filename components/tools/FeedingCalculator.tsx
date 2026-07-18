"use client";

import { useMemo, useState } from "react";
import {
  calcDailyFeedingGrams,
  LIFE_STAGE_COPY,
  type BodyCondition,
  type LifeStage,
  type PetSpecies,
} from "@/lib/tools/feeding";
import { Callout, Pill, SpeciesToggle, ToolHeroImage } from "@/components/tools/ToolUi";

const BODY_OPTIONS: { id: BodyCondition; label: string; hint: string }[] = [
  { id: "thin", label: "마른 편", hint: "갈비 촉지 쉬움" },
  { id: "ideal", label: "이상적", hint: "허리 라인 보임" },
  { id: "overweight", label: "과체중", hint: "허리 흐림" },
];

export function FeedingCalculator() {
  const [species, setSpecies] = useState<PetSpecies>("dog");
  const [lifeStage, setLifeStage] = useState<LifeStage>("adult");
  const [body, setBody] = useState<BodyCondition>("ideal");
  const [weight, setWeight] = useState(5);
  const [underFourMonths, setUnderFourMonths] = useState(false);

  const result = useMemo(
    () =>
      calcDailyFeedingGrams(
        weight,
        species,
        lifeStage,
        body,
        underFourMonths
      ),
    [weight, species, lifeStage, body, underFourMonths]
  );

  const lifeOptions = LIFE_STAGE_COPY[species];

  return (
    <div className="space-y-6">
      <ToolHeroImage
        src={
          species === "dog"
            ? "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1200&q=80&auto=format&fit=crop"
            : "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1200&q=80&auto=format&fit=crop"
        }
        alt={species === "dog" ? "식기를 바라보는 강아지" : "사료 앞의 고양이"}
        badge="수의영양 RER·MER 참고 계산"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SpeciesToggle
          value={species}
          onChange={(v) => {
            setSpecies(v);
            setWeight(v === "cat" ? 4 : 5);
          }}
        />
        <Pill color="primary">건사료 환산 참고값</Pill>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-[var(--card-shadow)] sm:p-6">
        <p className="text-sm font-bold text-foreground">
          생애 단계{" "}
          <span className="font-normal text-muted">— 열량 계수가 달라집니다</span>
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {(Object.keys(lifeOptions) as LifeStage[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setLifeStage(id)}
              className={`rounded-xl px-2 py-3 text-center transition-all ${
                lifeStage === id
                  ? "bg-primary text-white shadow-md shadow-primary/25"
                  : "bg-gray-50 text-foreground hover:bg-gray-100"
              }`}
            >
              <span className="block text-sm font-bold">{lifeOptions[id].label}</span>
              <span
                className={`mt-0.5 block text-[11px] ${
                  lifeStage === id ? "text-white/80" : "text-muted"
                }`}
              >
                {lifeOptions[id].hint}
              </span>
            </button>
          ))}
        </div>

        {lifeStage === "young" && (
          <label className="mt-3 flex items-center gap-2 rounded-xl bg-orange-50 px-3 py-2 text-sm text-orange-900">
            <input
              type="checkbox"
              checked={underFourMonths}
              onChange={(e) => setUnderFourMonths(e.target.checked)}
              className="rounded border-orange-300"
            />
            <span>
              <strong>생후 4개월 미만</strong> 급성장기 (계수 상향)
            </span>
          </label>
        )}

        <p className="mt-6 text-sm font-bold text-foreground">
          체형 점수{" "}
          <span className="font-normal text-muted">— BCS를 간단히</span>
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {BODY_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setBody(opt.id)}
              className={`rounded-xl px-2 py-3 text-center transition-all ${
                body === opt.id
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "bg-gray-50 text-foreground hover:bg-gray-100"
              }`}
            >
              <span className="block text-sm font-bold">{opt.label}</span>
              <span
                className={`mt-0.5 block text-[11px] ${
                  body === opt.id ? "text-white/80" : "text-muted"
                }`}
              >
                {opt.hint}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-6">
          <div className="flex items-end justify-between">
            <p className="text-sm font-bold text-foreground">현재 몸무게</p>
            <p className="text-3xl font-black tracking-tight text-primary">
              {weight}
              <span className="ml-1 text-sm font-semibold text-muted">kg</span>
            </p>
          </div>
          <input
            type="range"
            min={0.5}
            max={species === "cat" ? 12 : 50}
            step={0.5}
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            className="mt-3 w-full accent-[var(--primary)]"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-indigo-600 to-violet-700 p-5 text-white shadow-[var(--card-shadow-hover)] sm:p-6">
        <p className="text-sm font-medium text-white/80">
          하루 권장 급여량 · 건사료 평균 {result.kcalPerGram} kcal/g 환산
        </p>
        <p className="mt-2 text-5xl font-black tracking-tight">
          {result.gramsPerDay}
          <span className="ml-2 text-xl font-bold">g/일</span>
        </p>
        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-white/15 px-3 py-3 backdrop-blur">
            <p className="text-[11px] text-white/70">필요 열량</p>
            <p className="mt-1 text-lg font-bold">{result.mer} kcal</p>
          </div>
          <div className="rounded-xl bg-white/15 px-3 py-3 backdrop-blur">
            <p className="text-[11px] text-white/70">안정시(RER)</p>
            <p className="mt-1 text-lg font-bold">{result.rer} kcal</p>
          </div>
          <div className="rounded-xl bg-white/15 px-3 py-3 backdrop-blur">
            <p className="text-[11px] text-white/70">{result.meals}회 분할 시</p>
            <p className="mt-1 text-lg font-bold">약 {result.gramsPerMeal} g</p>
          </div>
        </div>
      </div>

      <Callout tone="warn" title="이렇게 활용하세요">
        <ul className="list-disc space-y-1 pl-4">
          <li>
            결과는 <strong className="text-amber-900">시작점</strong>입니다. 제품
            포장 급여표와 2주 단위 체중 변화로 미세 조정하세요.
          </li>
          <li>
            습식·화식은 kcal/g이 달라{" "}
            <strong className="text-amber-900">열량(kcal)</strong>을 기준으로
            환산하는 편이 정확합니다.
          </li>
          <li>
            질환·임신·수유·중증 비만은{" "}
            <strong className="text-amber-900">수의사 처방식</strong>이 우선입니다.
          </li>
        </ul>
      </Callout>

      <Callout tone="info" title="계산 공식 (유아독존 안내)">
        <p className="font-mono text-xs leading-relaxed text-primary">
          RER = 70 × 체중(kg)<sup>0.75</sup>
          <br />
          MER = RER × 생애·체형 계수
          <br />
          급여량(g) ≈ MER ÷ 사료 kcal/g
        </p>
      </Callout>
    </div>
  );
}
