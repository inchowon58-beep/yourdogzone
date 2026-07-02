import { Train } from "lucide-react";
import { formatStationName } from "@/lib/constants/region-nearby-stations";

type Props = {
  currentLabel: string;
  stations: string[];
};

/** 인근 지하철역 — SEO 키워드 노출 (링크·R2 조회 없음) */
export function NearbyStationSeoSection({ currentLabel, stations }: Props) {
  if (stations.length === 0) return null;

  const items = stations.map((s) => formatStationName(s));

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
        {currentLabel} 인근 지하철역 애견미용학원 검색
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        {currentLabel}에서 애견미용학원을 찾을 때 통학 거리·환승을 고려해
        함께 검색하는 인근 지하철역입니다.
      </p>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((station) => (
          <li key={station}>
            <div className="flex items-start gap-2 rounded-xl border border-gray-100 bg-white px-4 py-3.5">
              <Train className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden />
              <span>
                <span className="block text-sm font-semibold text-foreground">
                  {station} 애견미용학원
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  {currentLabel} 인근 · {station}
                </span>
              </span>
            </div>
          </li>
        ))}
      </ul>

      <p className="sr-only">
        {currentLabel} 애견미용학원 인근 지하철역:{" "}
        {items.map((s) => `${s} 애견미용학원`).join(", ")}
      </p>
    </section>
  );
}
