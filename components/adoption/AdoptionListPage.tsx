import Link from "next/link";
import { Suspense } from "react";
import { MapPin, Plus, Search } from "lucide-react";
import { AcademySearchBar } from "@/components/academy/AcademySearchBar";
import { ListPagination } from "@/components/ui/ListPagination";
import { REGION_BIG_OPTIONS } from "@/lib/constants/regions";
import { listingBasePath, listingDetailPath } from "@/lib/listings/config";
import { getThumbnail } from "@/lib/listings/queries";
import { paginate, parsePageParam } from "@/lib/utils/paginate";
import type { Listing } from "@/lib/types/listing";

type Props = {
  listings: Listing[];
  region: string;
  query?: string;
  pageParam?: string;
};

function RegionHashtags({
  activeRegion,
  query,
}: {
  activeRegion: string;
  query?: string;
}) {
  const basePath = listingBasePath("adoption");

  function href(region: string) {
    const params = new URLSearchParams();
    if (region !== "전체") params.set("region", region);
    if (query) params.set("q", query);
    const qs = params.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="-mx-1 flex flex-wrap justify-center gap-2">
      {REGION_BIG_OPTIONS.map((region) => {
        const isActive = activeRegion === region;
        const label = region === "전체" ? "#전체" : `#${region}`;
        return (
          <Link
            key={region}
            href={href(region)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
              isActive
                ? "bg-primary text-white shadow-sm"
                : "bg-white text-muted ring-1 ring-gray-200 hover:text-foreground hover:ring-primary/30"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}

function ShopCard({ listing }: { listing: Listing }) {
  const thumb = getThumbnail(listing);
  const href = listingDetailPath("adoption", listing.slug);
  const region = `${listing.region_big} ${listing.region_small}`.trim();

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[var(--card-shadow)] transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            사진 준비 중
          </div>
        )}
        {listing.is_premium ? (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold text-white">
            추천
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 px-3.5 py-3.5">
        <p className="truncate text-[15px] font-bold tracking-tight text-foreground sm:text-base">
          {listing.name}
        </p>
        <p className="flex items-center gap-1 truncate text-xs text-muted sm:text-[13px]">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {region || listing.address}
        </p>
        {listing.title_copy ? (
          <p className="line-clamp-2 text-xs leading-relaxed text-muted">
            {listing.title_copy}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

export function AdoptionListPage({
  listings,
  region,
  query,
  pageParam,
}: Props) {
  const basePath = listingBasePath("adoption");
  const premium = listings.filter((item) => item.is_premium);
  const regular = listings.filter((item) => !item.is_premium);
  const listPage = paginate(regular, parsePageParam(pageParam));
  const listQuery = {
    region: region !== "전체" ? region : undefined,
    q: query,
  };

  return (
    <main className="w-full min-w-0 px-4 py-8 sm:px-6 sm:py-10 md:py-14">
      <section className="mb-10 text-center md:mb-12">
        <p className="mb-2 text-sm font-bold tracking-[0.12em] text-primary">
          강아지분양
        </p>
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl md:text-4xl">
          믿을 수 있는 강아지 분양
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
          전국 {listings.length}곳 이상의 강아지분양 업체 정보를 한눈에.
          지역·키워드로 빠르게 찾아보세요.
        </p>

        <div className="mx-auto mt-7 flex w-full max-w-xl flex-col items-center gap-4">
          <div className="flex w-full min-w-0 items-center gap-2">
            <Search className="hidden h-5 w-5 shrink-0 text-muted sm:block" aria-hidden />
            <div className="w-full min-w-0">
              <Suspense fallback={null}>
                <AcademySearchBar
                  defaultQuery={query}
                  servicePath={basePath}
                  placeholder="업체명, 지역, 견종으로 검색"
                />
              </Suspense>
            </div>
          </div>
          <RegionHashtags activeRegion={region} query={query} />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={`${basePath}/register`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            <Plus className="h-4 w-4" />
            분양업체 등록
          </Link>
        </div>
      </section>

      {premium.length > 0 ? (
        <section className="mb-10">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-foreground sm:text-xl">
                추천 분양업체
              </h2>
              <p className="mt-1 text-sm text-muted">인증·추천 업체를 먼저 확인하세요</p>
            </div>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {premium.map((item) => (
              <li key={item.slug}>
                <ShopCard listing={item} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-foreground sm:text-xl">
            분양업체 목록
          </h2>
          <p className="mt-1 text-sm text-muted">
            {region === "전체" ? "전국" : region}
            {query ? ` · “${query}”` : ""} · {regular.length}곳
          </p>
        </div>

        {listPage.items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-12 text-center">
            <p className="text-sm text-muted">조건에 맞는 분양업체가 없습니다.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {listPage.items.map((item) => (
              <li key={item.slug}>
                <ShopCard listing={item} />
              </li>
            ))}
          </ul>
        )}

        <div className="mt-8">
          <ListPagination
            currentPage={listPage.page}
            totalPages={listPage.totalPages}
            pathname={basePath}
            query={listQuery}
          />
        </div>
      </section>
    </main>
  );
}
