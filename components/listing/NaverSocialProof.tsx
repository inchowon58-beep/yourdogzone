import { ExternalLink, Star } from "lucide-react";
import type { NaverBlogReview } from "@/lib/types/listing";

type Props = {
  rating?: number | null;
  reviewCount?: number | null;
  blogReviews?: NaverBlogReview[] | null;
  placeUrl?: string | null;
};

export function NaverSocialProof({
  rating,
  reviewCount,
  blogReviews,
  placeUrl,
}: Props) {
  const reviews = (blogReviews ?? []).filter((r) => r.title || r.body).slice(0, 5);
  const hasRating = rating != null && rating > 0;
  if (!hasRating && reviews.length === 0) return null;

  return (
    <section className="mb-8 space-y-4">
      {hasRating ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50/70 px-5 py-4 shadow-[var(--card-shadow)]">
          <span className="inline-flex items-center gap-1.5 text-amber-700">
            <Star className="h-5 w-5 fill-amber-500 text-amber-500" aria-hidden />
            <span className="text-2xl font-black tracking-tight">{rating}</span>
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground">네이버 평점</p>
            <p className="text-xs text-muted">
              {reviewCount != null ? `방문자 리뷰 ${reviewCount.toLocaleString()}건` : "네이버 플레이스 기준"}
              {placeUrl ? " · 등록 시 수집" : ""}
            </p>
          </div>
          {placeUrl?.startsWith("http") ? (
            <a
              href={placeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
            >
              네이버에서 보기
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}
        </div>
      ) : null}

      {reviews.length > 0 ? (
        <div className="rounded-2xl bg-white p-4 shadow-[var(--card-shadow)] sm:p-6">
          <h2 className="mb-4 text-lg font-bold text-foreground sm:text-xl">
            네이버 블로그 리뷰
          </h2>
          <ul className="space-y-3">
            {reviews.map((item, idx) => {
              const content = (
                <>
                  <p className="text-[15px] font-bold text-foreground sm:text-base">
                    {item.title}
                  </p>
                  {item.body ? (
                    <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">
                      {item.body}
                    </p>
                  ) : null}
                </>
              );
              return (
                <li
                  key={`${item.title}-${idx}`}
                  className="rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3.5"
                >
                  {item.url?.startsWith("http") ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block hover:opacity-90"
                    >
                      {content}
                    </a>
                  ) : (
                    content
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
