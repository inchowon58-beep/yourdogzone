import { notFound, redirect } from "next/navigation";
import { RegionalLandingPageView } from "@/components/regional/RegionalLandingPageView";
import { loadRegionalPageBundle } from "@/lib/academy/regional-page-loader";
import { scheduleRegionalPageBackfill } from "@/lib/academy/regional-backfill";
import { needsRegionalSeoContent } from "@/lib/academy/regional-seo-sync";
import { buildRegionalLandingMetadata } from "@/lib/academy/regional-seo-metadata";
import { getPublishedRegionalSlugs } from "@/lib/academy/regional-landing";

/** ISR — 수천 건 generateStaticParams + 지속 발행이라 force-static 비권장 */
export const revalidate = 3600;

const LEGACY_SLUG_REDIRECT: Record<string, string> = {
  "안산-애견미용학원": "ansan-dog-grooming-academy",
  "부천-애견미용학원": "bucheon-dog-grooming-academy",
  "인천-애견미용학원": "incheon-dog-grooming-academy",
  "수원-애견미용학원": "suwon-dog-grooming-academy",
  "성남-애견미용학원": "seongnam-dog-grooming-academy",
  "강남-애견미용학원": "gangnam-dog-grooming-academy",
};

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await getPublishedRegionalSlugs("academy");
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const bundle = await loadRegionalPageBundle(slug, "academy");
  if (!bundle) return {};

  return buildRegionalLandingMetadata(bundle.page, bundle.pageCtx.seoCtx);
}

export default async function RegionalAcademyLandingPage({ params }: PageProps) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);

  const legacy = LEGACY_SLUG_REDIRECT[decoded];
  if (legacy) {
    redirect(`/services/academy/region/${legacy}`);
  }

  const bundle = await loadRegionalPageBundle(decoded, "academy");
  if (!bundle) notFound();

  if (needsRegionalSeoContent(bundle.page)) {
    scheduleRegionalPageBackfill(bundle.page.slug);
  }

  return <RegionalLandingPageView bundle={bundle} />;
}
