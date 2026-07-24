import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { RegionalLandingPage } from "@/lib/types/regional-landing";
import { regionalLandingPath } from "@/lib/academy/regional-path";
import {
  getRegionalServiceConfig,
  resolvePageCategory,
} from "@/lib/seo/regional-service-config";

type Props = {
  currentLabel: string;
  pages: RegionalLandingPage[];
};

/**
 * 서버에서 이미 가져온 발행 목록만 렌더.
 * 가로 스크롤이어도 HTML에 전체 링크가 남아 SEO·내부링크에 유리하고,
 * 클라이언트 fetch / 추가 API 호출이 없어 Vercel 비용이 거의 늘지 않음.
 */
export function RecentRegionalPostsScroll({ currentLabel, pages }: Props) {
  if (pages.length === 0) return null;

  const sample = pages[0];
  const config = getRegionalServiceConfig(resolvePageCategory(sample));

  return (
    <section
      className="mb-12"
      aria-labelledby="related-regional-posts-heading"
    >
      <div className="mb-4 px-0.5">
        <p className="text-sm font-semibold text-primary">다른 지역 가이드</p>
        <h2
          id="related-regional-posts-heading"
          className="mt-1 text-lg font-bold text-foreground sm:text-xl"
        >
          {currentLabel} 외에 함께 보면 좋은 {config.title} 안내
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          이전에 발행된 {config.title} 지역 페이지입니다. 관심 지역을 눌러
          안내를 이어서 확인해 보세요.
        </p>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-0 sm:px-0">
        <ul className="flex w-max gap-3 pr-4 sm:pr-0">
          {pages.map((page) => {
            const pageConfig = getRegionalServiceConfig(
              resolvePageCategory(page)
            );
            const title =
              page.keyword?.trim() ||
              `${page.label} ${pageConfig.title}`;
            return (
              <li key={`${resolvePageCategory(page)}-${page.slug}`} className="shrink-0">
                <Link
                  href={regionalLandingPath(page)}
                  className="group flex h-full w-[15.5rem] flex-col justify-between rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-[var(--card-shadow)] transition hover:border-primary/25 hover:shadow-[var(--card-shadow-hover)] sm:w-[16.5rem]"
                >
                  <div>
                    <p className="text-xs font-semibold text-primary">
                      {page.label}
                    </p>
                    <p className="mt-1.5 line-clamp-2 text-sm font-bold leading-snug text-foreground group-hover:text-primary">
                      {title}
                    </p>
                    {page.metaDescription || page.regionInfo ? (
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted">
                        {page.metaDescription || page.regionInfo}
                      </p>
                    ) : null}
                  </div>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-muted group-hover:text-primary">
                    자세히 보기
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
