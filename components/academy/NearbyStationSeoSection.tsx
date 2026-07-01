import Link from "next/link";
import { Train } from "lucide-react";
import { formatStationName } from "@/lib/constants/region-nearby-stations";
import { regionalLandingPath } from "@/lib/academy/regional-path";
import type { RegionalLandingPage } from "@/lib/types/regional-landing";

type StationItem = {
  station: string;
  keyword: string;
  href: string | null;
};

type Props = {
  currentLabel: string;
  stations: string[];
  publishedLandings?: RegionalLandingPage[];
};

function stationLandingLabel(station: string): string {
  return station.replace(/역$/u, "").trim();
}

function resolveStationItems(
  stations: string[],
  publishedLandings: RegionalLandingPage[]
): StationItem[] {
  const byLabel = new Map(
    publishedLandings.map((p) => [p.label.trim(), p])
  );

  return stations.map((station) => {
    const name = formatStationName(station);
    const landing =
      byLabel.get(name) ?? byLabel.get(stationLandingLabel(name));
    return {
      station: name,
      keyword: `${name} 애견미용학원`,
      href: landing ? regionalLandingPath(landing) : null,
    };
  });
}

/** 인근 지하철역 5곳 — 본문·크롤러용 SEO 섹션 */
export function NearbyStationSeoSection({
  currentLabel,
  stations,
  publishedLandings = [],
}: Props) {
  if (stations.length === 0) return null;

  const items = resolveStationItems(stations, publishedLandings);

  return (
    <section
      className="mb-12 rounded-2xl border border-sky-100/80 bg-gradient-to-br from-sky-50/50 to-white p-6 shadow-[var(--card-shadow)] sm:p-8"
      aria-labelledby="nearby-stations-heading"
    >
      <p className="text-sm font-semibold text-primary">인근 지하철역</p>
      <h2
        id="nearby-stations-heading"
        className="mt-1 text-lg font-bold text-foreground sm:text-xl"
      >
        {currentLabel} 인근 지하철역 애견미용학원 검색 5곳
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        {currentLabel}에서 애견미용학원을 찾을 때 통학 거리·환승을 고려해
        함께 검색하는 인근 지하철역입니다.
      </p>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item.station}>
            {item.href ? (
              <Link
                href={item.href}
                className="group flex items-start gap-2 rounded-xl border border-gray-100 bg-white px-4 py-3.5 transition hover:border-primary/30 hover:shadow-sm"
              >
                <Train
                  className="mt-0.5 h-4 w-4 shrink-0 text-muted group-hover:text-primary"
                  aria-hidden
                />
                <span>
                  <span className="block text-sm font-semibold text-foreground group-hover:text-primary">
                    {item.keyword}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {currentLabel} 인근 · {item.station}
                  </span>
                </span>
              </Link>
            ) : (
              <div className="flex items-start gap-2 rounded-xl border border-dashed border-gray-200 bg-white/80 px-4 py-3.5">
                <Train className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden />
                <span>
                  <span className="block text-sm font-semibold text-foreground">
                    {item.keyword}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {currentLabel} 인근 · {item.station}
                  </span>
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>

      <p className="sr-only">
        {currentLabel} 애견미용학원 인근 지하철역:{" "}
        {items.map((i) => i.keyword).join(", ")}
      </p>
    </section>
  );
}
