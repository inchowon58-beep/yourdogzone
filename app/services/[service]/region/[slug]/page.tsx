import { notFound } from "next/navigation";
import { RegionalLandingPageView } from "@/components/regional/RegionalLandingPageView";
import { loadRegionalPageBundle } from "@/lib/academy/regional-page-loader";
import { scheduleRegionalPageBackfill } from "@/lib/academy/regional-backfill";
import { needsRegionalSeoContent } from "@/lib/academy/regional-seo-sync";
import { buildRegionalLandingMetadata } from "@/lib/academy/regional-seo-metadata";
import { getPublishedRegionalSlugs } from "@/lib/academy/regional-landing";
import { isListingCategory } from "@/lib/listings/config";
import type { ListingCategory } from "@/lib/types/listing";

/** ISR — 업체 수정(히어로 사진 등)이 지역 SEO에 빨리 반영되도록 짧게 */
export const revalidate = 60;
/** 대용량 index/단건 조회 여유 (Hobby 기본 10s면 404 유발) */
export const maxDuration = 60;

type PageProps = {
  params: Promise<{ service: string; slug: string }>;
};

export async function generateStaticParams() {
  const categories: ListingCategory[] = [
    "adoption",
    "shelter",
    "funeral",
    "breeder",
    "hospital",
  ];

  const entries = await Promise.all(
    categories.map(async (service) => {
      const slugs = await getPublishedRegionalSlugs(service);
      return slugs.map((slug) => ({ service, slug }));
    })
  );

  return entries.flat();
}

export async function generateMetadata({ params }: PageProps) {
  const { service, slug } = await params;
  if (!isListingCategory(service)) return {};

  const bundle = await loadRegionalPageBundle(slug, service);
  if (!bundle) return {};

  return buildRegionalLandingMetadata(bundle.page, bundle.pageCtx.seoCtx);
}

export default async function RegionalListingLandingPage({ params }: PageProps) {
  const { service, slug } = await params;
  if (!isListingCategory(service)) notFound();

  const decoded = decodeURIComponent(slug);
  const bundle = await loadRegionalPageBundle(decoded, service);
  if (!bundle) notFound();

  if (needsRegionalSeoContent(bundle.page)) {
    scheduleRegionalPageBackfill(bundle.page.slug);
  }

  return <RegionalLandingPageView bundle={bundle} />;
}
