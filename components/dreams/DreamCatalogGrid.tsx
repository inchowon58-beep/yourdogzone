"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  DREAM_ANIMAL_OPTIONS,
  DREAM_ARTICLES,
} from "@/lib/dreams/catalog";
import type { DreamAnimal } from "@/lib/dreams/types";

export function DreamCatalogGrid() {
  const [animal, setAnimal] = useState<DreamAnimal | "all">("dog");

  const list = useMemo(() => {
    if (animal === "all") return DREAM_ARTICLES.slice(0, 24);
    return DREAM_ARTICLES.filter((a) => a.animal === animal);
  }, [animal]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-black text-[#2c2a3a]">꿈 해몽 사전</h2>
          <p className="mt-1 text-sm text-[#6b6578]">
            검색으로 많이 찾는 장면별 상세 가이드
          </p>
        </div>
        <p className="text-xs font-semibold text-[#6b6578]">
          총 {DREAM_ARTICLES.length}개 해몽
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          type="button"
          onClick={() => setAnimal("all")}
          className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold ${
            animal === "all"
              ? "bg-[#2c2a3a] text-white"
              : "bg-white text-[#5c5668] ring-1 ring-[#e5dcd3]"
          }`}
        >
          인기
        </button>
        {DREAM_ANIMAL_OPTIONS.filter((o) => o.id !== "other").map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => setAnimal(o.id)}
            className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold ${
              animal === o.id
                ? "bg-[#2c2a3a] text-white"
                : "bg-white text-[#5c5668] ring-1 ring-[#e5dcd3]"
            }`}
          >
            {o.short}
          </button>
        ))}
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {list.map((a) => (
          <li key={a.slug}>
            <Link
              href={`/dreams/${a.slug}`}
              className="block h-full rounded-2xl border border-[#e8ddd4] bg-white px-4 py-4 shadow-[var(--card-shadow)] transition hover:border-[#c4a4a4]"
            >
              <span className="text-[10px] font-bold text-[#b88a8a]">
                {a.omen}
              </span>
              <p className="mt-1 text-sm font-bold leading-snug text-[#2c2a3a]">
                {a.title}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
