import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  currentPage: number;
  totalPages: number;
  pathname: string;
  query?: Record<string, string | undefined>;
};

function buildHref(
  pathname: string,
  page: number,
  query?: Record<string, string | undefined>
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (key === "page" || !value?.trim()) continue;
    params.set(key, value.trim());
  }
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

function pageNumbers(current: number, total: number): number[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  return [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
}

export function ListPagination({
  currentPage,
  totalPages,
  pathname,
  query,
}: Props) {
  if (totalPages <= 1) return null;

  const numbers = pageNumbers(currentPage, totalPages);

  return (
    <nav
      className="mt-6 flex flex-wrap items-center justify-center gap-1.5"
      aria-label="페이지 이동"
    >
      {currentPage > 1 ? (
        <Link
          href={buildHref(pathname, currentPage - 1, query)}
          className="inline-flex h-9 items-center gap-0.5 rounded-lg border border-gray-200 bg-white px-2.5 text-sm text-muted transition hover:text-foreground"
          aria-label="이전 페이지"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">이전</span>
        </Link>
      ) : (
        <span className="inline-flex h-9 items-center gap-0.5 rounded-lg border border-gray-100 px-2.5 text-sm text-gray-300">
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">이전</span>
        </span>
      )}

      {numbers.map((page, index) => {
        const prev = numbers[index - 1];
        const showEllipsis = prev !== undefined && page - prev > 1;

        return (
          <span key={page} className="flex items-center gap-1.5">
            {showEllipsis && (
              <span className="px-1 text-sm text-muted" aria-hidden>
                …
              </span>
            )}
            {page === currentPage ? (
              <span
                className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg bg-primary px-2.5 text-sm font-semibold text-white"
                aria-current="page"
              >
                {page}
              </span>
            ) : (
              <Link
                href={buildHref(pathname, page, query)}
                className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-gray-200 bg-white px-2.5 text-sm text-muted transition hover:text-foreground"
              >
                {page}
              </Link>
            )}
          </span>
        );
      })}

      {currentPage < totalPages ? (
        <Link
          href={buildHref(pathname, currentPage + 1, query)}
          className="inline-flex h-9 items-center gap-0.5 rounded-lg border border-gray-200 bg-white px-2.5 text-sm text-muted transition hover:text-foreground"
          aria-label="다음 페이지"
        >
          <span className="hidden sm:inline">다음</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className="inline-flex h-9 items-center gap-0.5 rounded-lg border border-gray-100 px-2.5 text-sm text-gray-300">
          <span className="hidden sm:inline">다음</span>
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
