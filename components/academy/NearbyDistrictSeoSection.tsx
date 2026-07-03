import Link from "next/link";
import { MapPin } from "lucide-react";

type Props = {
  currentLabel: string;
  areas: string[];
  keywordSuffix?: string;
};

/** 구·동 단위 근방 — SEO 키워드 노출 (링크·R2 조회 없음) */
export function NearbyDistrictSeoSection({
  currentLabel,
  areas,
  keywordSuffix = "애견미용학원",
}: Props) {
  if (areas.length === 0) return null;

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
        {currentLabel} 인근에서 함께 찾는 {keywordSuffix} 지역
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        {currentLabel}에서 {keywordSuffix}을 알아보는 분들이 통학·상담 범위로
        함께 검색하는 근방 구·동입니다.
      </p>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {areas.map((area) => (
          <li key={area}>
            <div className="flex items-start gap-2 rounded-xl border border-gray-100 bg-white px-4 py-3.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden />
              <span>
                <span className="block text-sm font-semibold text-foreground">
                  {area} {keywordSuffix}
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  {currentLabel} 인근 · {area}
                </span>
              </span>
            </div>
          </li>
        ))}
      </ul>

      <p className="sr-only">
        {currentLabel} 애견미용학원 근방 지역:{" "}
        {areas.map((a) => `${a} 애견미용학원`).join(", ")}
      </p>
    </section>
  );
}
