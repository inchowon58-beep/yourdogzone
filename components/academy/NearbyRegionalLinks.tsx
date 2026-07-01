import Link from "next/link";
import { MapPin, ChevronRight } from "lucide-react";
import type { RegionalLandingPage } from "@/lib/types/regional-landing";
import { regionalLandingPath } from "@/lib/academy/regional-landing";

type Props = {
  currentLabel: string;
  intro?: string;
  nearby: RegionalLandingPage[];
};

export function NearbyRegionalLinks({ currentLabel, intro, nearby }: Props) {
  if (nearby.length === 0) return null;

  const text =
    intro ??
    `${currentLabel}에서 애견미용학원을 알아보는 분들이 근방에서 함께 검색·방문하는 지역입니다.`;

  return (
    <section className="mb-12 rounded-2xl border border-gray-100 bg-gradient-to-br from-slate-50 to-white p-6 shadow-[var(--card-shadow)] sm:p-8">
      <p className="text-sm font-semibold text-primary">근방 지역</p>
      <h2 className="mt-1 text-lg font-bold text-foreground sm:text-xl">
        {currentLabel} 인근에서 많이 함께 찾는 애견미용학원 지역
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">{text}</p>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {nearby.map((page) => (
          <li key={page.slug}>
            <Link
              href={regionalLandingPath(page)}
              className="group flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3.5 transition hover:border-primary/30 hover:shadow-sm"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-foreground group-hover:text-primary">
                <MapPin className="h-4 w-4 shrink-0 text-muted group-hover:text-primary" />
                {page.label} 애견미용학원
              </span>
              <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-primary" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
