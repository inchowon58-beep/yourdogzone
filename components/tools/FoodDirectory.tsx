"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { PetSpecies } from "@/lib/tools/feeding";
import {
  FOOD_LEVEL_HINT,
  FOOD_LEVEL_LABEL,
  FOOD_LEVEL_TONE,
  PET_FOODS,
  levelFor,
  type FoodLevel,
} from "@/lib/tools/foods";
import { Callout, Pill, SpeciesToggle, ToolHeroImage } from "@/components/tools/ToolUi";
import { SafeFoodImage } from "@/components/tools/SafeFoodImage";

const ORDER: FoodLevel[] = ["danger", "caution", "safe"];

export function FoodDirectory() {
  const [species, setSpecies] = useState<PetSpecies>("dog");
  const [query, setQuery] = useState("");

  const grouped = useMemo(() => {
    const q = query.trim();
    const list = PET_FOODS.filter((f) => {
      if (!q) return true;
      return (
        f.name.includes(q) ||
        f.keywords.some((k) => k.includes(q)) ||
        f.oneLiner.includes(q)
      );
    });
    return ORDER.map((level) => ({
      level,
      items: list.filter((f) => levelFor(f, species) === level),
    }));
  }, [species, query]);

  return (
    <div className="space-y-8">
      <ToolHeroImage
        src="https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=1200&q=80&auto=format&fit=crop"
        alt="반려견과 사람"
        badge="강아지 · 고양이 신호등 가이드"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SpeciesToggle value={species} onChange={setSpecies} />
        <div className="flex flex-wrap gap-1.5">
          {ORDER.map((level) => (
            <Pill
              key={level}
              color={level === "danger" ? "red" : level === "caution" ? "amber" : "emerald"}
            >
              {FOOD_LEVEL_LABEL[level]} · {FOOD_LEVEL_HINT[level]}
            </Pill>
          ))}
        </div>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="음식 이름 검색 (예: 초콜릿, 포도, 우유)"
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-[var(--card-shadow)] outline-none focus:border-primary"
      />

      <Callout tone="danger" title="응급 원칙">
        <strong className="text-red-700">위험</strong> 표시 음식은 소량도
        금지입니다. 섭취가 확인되면 증상 여부와 관계없이 동물병원에 문의하세요.
      </Callout>

      {grouped.map(({ level, items }) => {
        const tone = FOOD_LEVEL_TONE[level];
        return (
          <section key={level}>
            <div className="mb-4 flex items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold text-white ${tone.bg}`}
              >
                {FOOD_LEVEL_LABEL[level]}
              </span>
              <h2 className="text-base font-bold text-foreground">
                {FOOD_LEVEL_HINT[level]}{" "}
                <span className="text-muted">{items.length}</span>
              </h2>
            </div>

            {items.length === 0 ? (
              <p className="text-sm text-muted">검색 결과가 없습니다.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {items.map((food) => (
                  <Link
                    key={food.slug}
                    href={`/tools/food/${food.slug}?species=${species}`}
                    className="group overflow-hidden rounded-2xl bg-white shadow-[var(--card-shadow)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--card-shadow-hover)]"
                  >
                    <div className="relative h-28 overflow-hidden">
                      <SafeFoodImage
                        src={food.image}
                        alt={food.imageAlt}
                        emoji={food.emoji}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                      <span
                        className={`absolute right-2 top-2 rounded-full px-2.5 py-1 text-[11px] font-bold text-white ${tone.bg}`}
                      >
                        {FOOD_LEVEL_LABEL[level]}
                      </span>
                    </div>
                    <div className="p-4">
                      <p className="font-bold text-foreground">
                        <span className="mr-1">{food.emoji}</span>
                        {food.name}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-muted">
                        {food.oneLiner}
                      </p>
                      <p className={`mt-2 text-xs font-semibold ${tone.text}`}>
                        {food.verdict[species]}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        );
      })}

      <Callout tone="info" title="면책">
        본 가이드는 일반적인 수의독성학·영양 정보를 바탕으로 한{" "}
        <strong>참고 자료</strong>이며, 개별 진료를 대체하지 않습니다.
      </Callout>
    </div>
  );
}
