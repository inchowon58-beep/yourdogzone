import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { AcademySearchBar } from "@/components/academy/AcademySearchBar";
import { RegionTabs } from "@/components/academy/RegionTabs";
import { PremiumAcademyGrid } from "@/components/academy/PremiumAcademyGrid";
import { AcademyList } from "@/components/academy/AcademyList";
import { ListPagination } from "@/components/ui/ListPagination";
import {
  getListingConfig,
  isListingCategory,
  listingBasePath,
} from "@/lib/listings/config";
import { getListings, listingAsAcademy } from "@/lib/listings/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildCategoryOgSubtitle } from "@/lib/seo/og-image-shared";
import { paginate, parsePageParam } from "@/lib/utils/paginate";
import type { ListingCategory } from "@/lib/types/listing";
import { AdoptionListPage } from "@/components/adoption/AdoptionListPage";

type PageProps = {
  params: Promise<{ service: string }>;
  searchParams: Promise<{ region?: string; q?: string; page?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { service } = await params;
  if (!isListingCategory(service)) return { title: "서비스" };
  const config = getListingConfig(service);
  return buildPageMetadata({
    title: config.listTitle,
    description: config.description,
    path: listingBasePath(service),
    keywords: config.seoKeywords,
    ogSubtitle: buildCategoryOgSubtitle(config.title),
  });
}

export default async function ListingServicePage({ params, searchParams }: PageProps) {
  const { service } = await params;
  if (!isListingCategory(service)) notFound();

  const category = service as ListingCategory;
  const config = getListingConfig(category);
  const basePath = listingBasePath(category);
  const { region = "전체", q, page: pageParam } = await searchParams;
  const all = await getListings(category, { region, query: q });

  if (category === "adoption") {
    return (
      <AdoptionListPage
        listings={all}
        region={region}
        query={q}
        pageParam={pageParam}
      />
    );
  }

  const premium = all.filter((item) => item.is_premium);
  const regular = all.filter((item) => !item.is_premium);
  const listPage = paginate(regular, parsePageParam(pageParam));
  const listQuery = { region: region !== "전체" ? region : undefined, q };
  const asAcademy = (items: typeof all) => items.map(listingAsAcademy);

  return (
    <main className="w-full min-w-0 px-4 py-8 sm:px-6 sm:py-10 md:py-14">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        홈으로
      </Link>

      <section className="mb-10 text-center md:mb-14">
        <p className="mb-3 text-sm font-semibold text-primary">{config.title}</p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
          {config.listTitle}
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-base text-muted">{config.description}</p>
        <div className="mt-8 flex w-full min-w-0 justify-center">
          <Suspense fallback={null}>
            <AcademySearchBar defaultQuery={q} servicePath={basePath} />
          </Suspense>
        </div>
      </section>

      <section className="mb-8">
        <RegionTabs activeRegion={region} query={q} servicePath={basePath} />
      </section>

      {premium.length > 0 && (
        <section className="mb-12">
          <PremiumAcademyGrid
            academies={asAcademy(premium)}
            servicePath={basePath}
            premiumTitle={config.premiumLabel}
            premiumBadge={config.premiumLabel}
          />
        </section>
      )}

      <AcademyList
        academies={asAcademy(listPage.items)}
        servicePath={basePath}
        listTitle={`전체 ${config.singular}`}
        registerLabel={`${config.singular} 정보 등록하기`}
        totalCount={listPage.totalItems}
      />
      <ListPagination
        currentPage={listPage.page}
        totalPages={listPage.totalPages}
        pathname={basePath}
        query={listQuery}
      />

      <div className="mt-12 flex flex-wrap justify-center gap-4 text-center">
        <Link
          href={`${basePath}/register`}
          className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-semibold text-primary shadow-[var(--card-shadow)] transition hover:shadow-[var(--card-shadow-hover)]"
        >
          <Plus className="h-4 w-4" />
          {config.singular} 정보 등록하기
        </Link>
        <Link
          href={`${basePath}/admin`}
          className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-semibold text-muted shadow-sm transition hover:text-foreground"
        >
          관리자
        </Link>
      </div>
    </main>
  );
}
