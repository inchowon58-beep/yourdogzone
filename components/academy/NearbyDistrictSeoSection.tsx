import Link from "next/link";
import { MapPin } from "lucide-react";
import { regionalLandingPath } from "@/lib/academy/regional-path";
import type { RegionalLandingPage } from "@/lib/types/regional-landing";

export type NearbyAreaItem = {
  area: string;
  keyword: string;
  href: string | null;
};

type Props = {
  currentLabel: string;
  areas: string[];
  /** 게시된 지역 페이지 — 있으면 내부 링크 */
  publishedLandings?: RegionalLandingPage[];
};

function resolveAreaItems(
  areas: string[],
  publishedLandings: RegionalLandingPage[]
): NearbyAreaItem[] {
  const byLabel = new Map(
    publishedLandings.map((p) => [p.label.trim(), p])
  );

  return areas.map((area) => {
    const landing = byLabel.get(area.trim());
    return {
      area,
      keyword: `${area} 애견미용학원`,
      href: landing ? regionalLandingPath(landing) : null,
    };
  });
}

/** 구·동 단위 근방 5곳 — 본문·크롤러용 SEO 섹션 */
export function NearbyDistrictSeoSection({
  currentLabel,
  areas,
  publishedLandings = [],
}: Props) {
  if (areas.length === 0) return null;

  const items = resolveAreaItems(areas, publishedLandings);

  return (
    <section
      className="mb-12 rounded-2xl border border-indigo-100/80 bg-gradient-to-br from-indigo-50/40 to-white p-6 shadow-[var(--card-shadow)] sm:p-8"
      aria-labelledby="nearby-districts-heading"
    >
      <p className="text-sm font-semibold text-primary">근방 지역 (구·동)</p>
      <h2
        id="nearby-districts-heading"
        className="mt-1 text-lg font-bold text-foreground sm:text-xl"
      >
        {currentLabel} 인근에서 함께 찾는 애견미용학원 지역 5곳
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        {currentLabel}에서 애견미용학원을 알아보는 분들이 통학·상담 범위로
        함께 검색하는 근방 구·동입니다. 아래 지역도 함께 비교해 보세요.
      </p>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item.area}>
            {item.href ? (
              <Link
                href={item.href}
                className="group flex items-start gap-2 rounded-xl border border-gray-100 bg-white px-4 py-3.5 transition hover:border-primary/30 hover:shadow-sm"
              >
                <MapPin
                  className="mt-0.5 h-4 w-4 shrink-0 text-muted group-hover:text-primary"
                  aria-hidden
                />
                <span>
                  <span className="block text-sm font-semibold text-foreground group-hover:text-primary">
                    {item.keyword}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {currentLabel} 인근 · {item.area}
                  </span>
                </span>
              </Link>
            ) : (
              <div className="flex items-start gap-2 rounded-xl border border-dashed border-gray-200 bg-white/80 px-4 py-3.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden />
                <span>
                  <span className="block text-sm font-semibold text-foreground">
                    {item.keyword}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {currentLabel} 인근 · {item.area}
                  </span>
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>

      <p className="sr-only">
        {currentLabel} 애견미용학원 근방 지역:{" "}
        {items.map((i) => i.keyword).join(", ")}
      </p>
    </section>
  );
}
