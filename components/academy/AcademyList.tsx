import Link from "next/link";
import { ChevronRight, MapPin } from "lucide-react";
import type { Academy } from "@/lib/types/academy";
import { getAcademyThumbnail } from "@/lib/academy/images";
import { AcademyThumbnail } from "@/components/academy/AcademyThumbnail";

export function AcademyList({ academies }: { academies: Academy[] }) {
  if (academies.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-12 text-center shadow-[var(--card-shadow)]">
        <p className="text-muted">검색 조건에 맞는 학원이 없습니다.</p>
        <Link
          href="/services/academy/register"
          className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
        >
          학원 정보 등록하기 →
        </Link>
      </div>
    );
  }

  return (
    <section>
      <h2 className="mb-4 text-lg font-bold text-foreground">전체 학원</h2>
      <ul className="divide-y divide-gray-50 overflow-hidden rounded-2xl bg-white shadow-[var(--card-shadow)]">
        {academies.map((academy) => (
          <li key={academy.id}>
            <Link
              href={`/services/academy/${academy.slug}`}
              className="flex items-center gap-4 px-6 py-5 transition-colors hover:bg-gray-50/80"
            >
              <AcademyThumbnail
                src={getAcademyThumbnail(academy)}
                alt={academy.name}
                className="h-16 w-16 shrink-0 rounded-xl"
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">{academy.name}</p>
                <p className="mt-0.5 truncate text-sm text-muted">
                  {academy.title_copy}
                </p>
                <p className="mt-1.5 flex items-center gap-1 text-xs text-muted">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {academy.region_big} {academy.region_small} · {academy.address}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-gray-300" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
