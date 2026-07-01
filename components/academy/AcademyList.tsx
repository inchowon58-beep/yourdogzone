import Link from "next/link";
import { ChevronRight, MapPin } from "lucide-react";
import type { Academy } from "@/lib/types/academy";
import { getAcademyThumbnail } from "@/lib/academy/images";
import { AcademyThumbnail } from "@/components/academy/AcademyThumbnail";

export function AcademyList({
  academies,
  servicePath = "/services/academy",
  listTitle = "전체 학원",
  registerLabel = "학원 정보 등록하기",
  totalCount,
}: {
  academies: Academy[];
  servicePath?: string;
  listTitle?: string;
  registerLabel?: string;
  /** 전체 건수 (일부만 노출할 때 안내) */
  totalCount?: number;
}) {
  if (academies.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-12 text-center shadow-[var(--card-shadow)]">
        <p className="text-muted">검색 조건에 맞는 항목이 없습니다.</p>
        <Link
          href={`${servicePath}/register`}
          className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
        >
          {registerLabel} →
        </Link>
      </div>
    );
  }

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-lg font-bold text-foreground">{listTitle}</h2>
        {totalCount !== undefined && totalCount > academies.length && (
          <p className="text-xs text-muted">
            전체 {totalCount}곳 중 {academies.length}곳 표시
          </p>
        )}
      </div>
      <ul className="divide-y divide-gray-50 overflow-hidden rounded-2xl bg-white shadow-[var(--card-shadow)]">
        {academies.map((academy) => (
          <li key={academy.id}>
            <Link
              href={`${servicePath}/${academy.slug}`}
              className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-gray-50/80 sm:gap-4 sm:px-6 sm:py-5"
            >
              <AcademyThumbnail
                src={getAcademyThumbnail(academy)}
                alt={academy.name}
                className="h-14 w-14 shrink-0 rounded-xl sm:h-16 sm:w-16"
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">{academy.name}</p>
                <p className="mt-0.5 line-clamp-2 text-sm text-muted sm:truncate">
                  {academy.title_copy}
                </p>
                <p className="mt-1.5 flex items-start gap-1 text-xs text-muted sm:items-center">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 sm:mt-0" />
                  <span className="line-clamp-2 sm:truncate">
                    {academy.region_big} {academy.region_small} · {academy.address}
                  </span>
                </p>
              </div>
              <ChevronRight className="hidden h-5 w-5 shrink-0 text-gray-300 sm:block" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
