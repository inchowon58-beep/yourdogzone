"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  countBySpecies,
  filterGuides,
} from "@/lib/health";
import {
  KIND_LABEL,
  SPECIES_LABEL,
  SYSTEM_LABEL,
  URGENCY_LABEL,
  URGENCY_STYLE,
  type GuideKind,
  type HealthSpecies,
} from "@/lib/health/types";

const SPECIES_TABS: Array<HealthSpecies | "all"> = [
  "all",
  "dog",
  "cat",
  "reptile",
  "bird",
  "small",
  "fish",
];

const KIND_TABS: Array<GuideKind | "all"> = [
  "all",
  "disease",
  "symptom",
  "prevention",
];

export function HealthEncyclopedia() {
  const [species, setSpecies] = useState<HealthSpecies | "all">("all");
  const [kind, setKind] = useState<GuideKind | "all">("all");
  const [q, setQ] = useState("");
  const counts = useMemo(() => countBySpecies(), []);

  const guides = useMemo(
    () => filterGuides({ species, kind, q }),
    [species, kind, q]
  );

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-teal-700 via-primary to-indigo-700 p-6 text-white shadow-[var(--card-shadow-hover)] sm:p-8">
        <p className="text-xs font-bold tracking-widest text-white/70">
          HEALTH LIBRARY
        </p>
        <h2 className="mt-2 text-2xl font-black sm:text-3xl">
          증상 · 질병 · 예방을 한곳에서
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/90">
          종별로 흔한 증상과 질환을 골라,{" "}
          <strong className="text-white">증상·질병·예방</strong> 흐름으로
          바로 행동할 수 있게 정리했습니다. 본 자료는{" "}
          <strong className="text-white">진단이 아닌 참고용</strong>입니다.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
            총 {counts.all}개 가이드
          </span>
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
            강아지 {counts.dog}
          </span>
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
            고양이 {counts.cat}
          </span>
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
            이색동물 {counts.reptile + counts.bird + counts.small + counts.fish}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">
          가이드 유형
        </p>
        <div className="flex flex-wrap gap-2">
          {KIND_TABS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`rounded-full px-3.5 py-2 text-xs font-bold transition ${
                kind === k
                  ? "bg-primary text-white shadow-md shadow-primary/25"
                  : "bg-white text-muted shadow-[var(--card-shadow)] hover:text-foreground"
              }`}
            >
              {k === "all" ? "전체" : KIND_LABEL[k]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">
          종
        </p>
        <div className="flex flex-wrap gap-2">
          {SPECIES_TABS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpecies(s)}
              className={`rounded-full px-3.5 py-2 text-xs font-bold transition ${
                species === s
                  ? "bg-teal-700 text-white"
                  : "bg-teal-50 text-teal-900 hover:bg-teal-100"
              }`}
            >
              {s === "all" ? "전체" : SPECIES_LABEL[s]}
              <span className="ml-1 opacity-70">
                {s === "all" ? counts.all : counts[s]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="증상·병명 검색 (예: 구토, 슬개골, 신부전, 백점병)"
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-[var(--card-shadow)] outline-none focus:border-primary"
      />

      <p className="text-sm text-muted">
        <strong className="text-foreground">{guides.length}</strong>개 결과
      </p>

      {guides.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center text-sm text-muted shadow-[var(--card-shadow)]">
          검색 결과가 없습니다. 다른 키워드나 필터를 시도해 보세요.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {guides.map((g) => {
            const urgency = URGENCY_STYLE[g.urgency];
            return (
              <Link
                key={g.slug}
                href={`/health/${g.slug}`}
                className="group flex flex-col rounded-2xl bg-white p-5 shadow-[var(--card-shadow)] transition hover:-translate-y-0.5 hover:shadow-[var(--card-shadow-hover)]"
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                    {KIND_LABEL[g.kind]}
                  </span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-700">
                    {SYSTEM_LABEL[g.system]}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${urgency.badge}`}
                  >
                    {URGENCY_LABEL[g.urgency]}
                  </span>
                </div>
                <h3 className="mt-3 text-base font-bold text-foreground group-hover:text-primary">
                  {g.title}
                </h3>
                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted">
                  {g.summary}
                </p>
                <p className="mt-3 text-[11px] font-semibold text-teal-700">
                  {g.species.map((s) => SPECIES_LABEL[s]).join(" · ")}
                </p>
              </Link>
            );
          })}
        </div>
      )}

      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950">
        <strong className="text-amber-800">면책:</strong> 본 자료는 교육·참고용이며
        수의 진단을 대체하지 않습니다. 응급·이상 증상은 반드시 동물병원에서
        진료받으세요.
      </div>
    </div>
  );
}
