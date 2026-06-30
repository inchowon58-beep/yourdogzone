import Link from "next/link";
import { Dog } from "lucide-react";
import { breedDetailPath } from "@/lib/breeds/config";
import { BREED_KIND_LABELS } from "@/lib/breeds/config";
import type { Breed } from "@/lib/types/breed";

export function BreedGrid({ breeds }: { breeds: Breed[] }) {
  if (breeds.length === 0) {
    return (
      <p className="py-16 text-center text-muted">검색 결과가 없습니다.</p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {breeds.map((breed) => (
        <Link
          key={breed.slug}
          href={breedDetailPath(breed.slug)}
          className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[var(--card-shadow)] transition hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
        >
          <div className="relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            {breed.hero_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={breed.hero_image}
                alt={breed.name_ko}
                className="h-full w-full object-cover"
              />
            ) : (
              <Dog className="h-10 w-10 text-gray-300 transition group-hover:text-primary/40" />
            )}
            <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-primary">
              {breed.size_label}
            </span>
          </div>
          <div className="flex flex-1 flex-col p-3 sm:p-4">
            <h2 className="font-semibold leading-tight text-foreground group-hover:text-primary">
              {breed.name_ko}
            </h2>
            <p className="mt-0.5 text-xs text-muted">{breed.name_en}</p>
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted">
              {breed.summary}
            </p>
            <div className="mt-auto flex flex-wrap gap-1 pt-3">
              <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] text-muted">
                {BREED_KIND_LABELS[breed.kind]}
              </span>
              {breed.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-primary/5 px-1.5 py-0.5 text-[10px] text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
