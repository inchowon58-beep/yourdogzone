import Link from "next/link";
import { MapPin, Phone, Star } from "lucide-react";
import type { Academy } from "@/lib/types/academy";

export function PremiumAcademyGrid({ academies }: { academies: Academy[] }) {
  if (academies.length === 0) return null;

  return (
    <section>
      <div className="mb-6 flex items-center gap-2">
        <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
        <h2 className="text-lg font-bold text-foreground">인증 추천 학원</h2>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {academies.map((academy) => (
          <Link
            key={academy.id}
            href={`/services/academy/${academy.slug}`}
            className="group relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-white p-6 shadow-[var(--card-shadow)] transition-all hover:-translate-y-1 hover:shadow-[var(--card-shadow-hover)]"
          >
            <span className="mb-4 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
              <Star className="h-3 w-3 fill-white" />
              인증 추천 학원
            </span>

            {academy.logo_image && (
              <div
                className="mb-4 h-20 w-20 rounded-xl bg-cover bg-center"
                style={{ backgroundImage: `url(${academy.logo_image})` }}
              />
            )}

            <h3 className="text-lg font-bold text-foreground group-hover:text-primary">
              {academy.name}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted line-clamp-2">
              {academy.title_copy}
            </p>

            <div className="mt-4 space-y-1.5 text-xs text-muted">
              <p className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {academy.region_big} {academy.region_small}
              </p>
              {academy.phone && (
                <p className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  {academy.phone}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
