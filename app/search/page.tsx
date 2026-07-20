import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Search } from "lucide-react";
import { searchSite } from "@/lib/search/site-search";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { SearchForm } from "@/components/search/SearchForm";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  if (!query) {
    return buildPageMetadata({
      title: "검색",
      description: "증상·질병 백과, 먹어도 되나요, 케어 도구와 서비스를 검색하세요.",
      path: "/search",
      ogSubtitle: "검색",
    });
  }
  return buildPageMetadata({
    title: `"${query}" 검색 결과`,
    description: `${query} 관련 증상·질병 백과, 먹이정보, 케어 도구 검색 결과`,
    path: `/search?q=${encodeURIComponent(query)}`,
    ogSubtitle: "검색",
  });
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const hits = query ? searchSite(query) : [];

  const grouped = {
    health: hits.filter((h) => h.category === "증상·질병 백과"),
    food: hits.filter((h) => h.category === "먹어도 되나요"),
    care: hits.filter((h) => h.category === "케어존"),
    service: hits.filter((h) => h.category === "핵심 서비스"),
  };

  return (
    <main className="w-full min-w-0 px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        홈으로
      </Link>

      <h1 className="text-2xl font-black tracking-tight">검색</h1>
      <p className="mt-2 text-sm text-muted">
        증상·질병 백과, 먹어도 되나요, 케어존, 서비스를 한 번에 찾습니다.
      </p>

      <div className="mt-6">
        <SearchForm defaultQuery={query} />
      </div>

      {!query && (
        <div className="mt-10 rounded-2xl bg-white p-6 text-center shadow-[var(--card-shadow)]">
          <Search className="mx-auto h-8 w-8 text-muted" />
          <p className="mt-3 text-sm text-muted">
            예: <strong className="text-foreground">초콜릿</strong>,{" "}
            <strong className="text-foreground">슬개골</strong>,{" "}
            <strong className="text-foreground">신부전</strong>,{" "}
            <strong className="text-foreground">급여량</strong>
          </p>
        </div>
      )}

      {query && hits.length === 0 && (
        <div className="mt-10 rounded-2xl bg-white p-6 text-center shadow-[var(--card-shadow)]">
          <p className="font-semibold text-foreground">
            &ldquo;{query}&rdquo; 검색 결과가 없습니다
          </p>
          <p className="mt-2 text-sm text-muted">
            다른 키워드로 시도하거나{" "}
            <Link href="/health" className="font-semibold text-primary">
              질병 백과
            </Link>
            ·
            <Link href="/tools/food" className="font-semibold text-primary">
              먹어도 되나요
            </Link>
            에서 직접 둘러보세요.
          </p>
        </div>
      )}

      {query && hits.length > 0 && (
        <div className="mt-8 space-y-8">
          <p className="text-sm text-muted">
            <strong className="text-foreground">{hits.length}</strong>개 결과
          </p>

          <ResultGroup title="증상·질병 백과" items={grouped.health} />
          <ResultGroup title="먹어도 되나요" items={grouped.food} />
          <ResultGroup title="케어존" items={grouped.care} />
          <ResultGroup title="핵심 서비스" items={grouped.service} />
        </div>
      )}
    </main>
  );
}

function ResultGroup({
  title,
  items,
}: {
  title: string;
  items: ReturnType<typeof searchSite>;
}) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 text-sm font-bold text-foreground">
        {title}{" "}
        <span className="font-normal text-muted">{items.length}</span>
      </h2>
      <ul className="space-y-2">
        {items.map((hit) => (
          <li key={hit.id}>
            <Link
              href={hit.href}
              className="group flex items-start justify-between gap-3 rounded-2xl bg-white p-4 shadow-[var(--card-shadow)] transition hover:-translate-y-0.5 hover:shadow-[var(--card-shadow-hover)]"
            >
              <div className="min-w-0">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${hit.categoryColor}`}
                >
                  {hit.category}
                </span>
                <p className="mt-1.5 font-bold text-foreground group-hover:text-primary">
                  {hit.title}
                </p>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
                  {hit.description}
                </p>
              </div>
              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted group-hover:text-primary" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
