import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { unstable_noStore } from "next/cache";
import { ArrowLeft, MapPin, Plus } from "lucide-react";
import { PremiumAcademyGrid } from "@/components/academy/PremiumAcademyGrid";
import { AcademyGuideTabs } from "@/components/academy/AcademyGuideTabs";
import { AcademyList } from "@/components/academy/AcademyList";
import { RegionalAcademySeoSection } from "@/components/academy/RegionalAcademySeoSection";
import { ChairmanConsultBanner } from "@/components/academy/ChairmanConsultBanner";
import { OfficialAdvisoryBoardSection } from "@/components/academy/OfficialAdvisoryBoardSection";
import { NearbyPremiumAcademyFallback } from "@/components/academy/NearbyPremiumAcademyFallback";
import { NearbyRegionalLinks } from "@/components/academy/NearbyRegionalLinks";
import { loadRegionalPageContext } from "@/lib/academy/regional-page-context";
import {
  resolveBoundNearbyIntro,
  resolveBoundFaqItems,
  resolveBoundRegionInfo,
  resolveBoundSeoBlocks,
  resolveBoundSeoSectionIntro,
} from "@/lib/academy/regional-seo-resolve";
import { getAcademyGalleryImages } from "@/lib/academy/images";
import { getAllPremiumAcademies } from "@/lib/academy/premium-pool";
import { buildRegionalSeoContext } from "@/lib/academy/regional-seo-vars";
import { ensureRegionalSeoContent } from "@/lib/academy/regional-seo-sync";
import { buildRegionalLandingMetadata } from "@/lib/academy/regional-seo-metadata";
import {
  getPublishedRegionalSlugs,
  resolveRegionalLanding,
} from "@/lib/academy/regional-landing";
import { resolveNearbyPages } from "@/lib/academy/regional-store";
import { sampleRandom, sampleStableRandom } from "@/lib/utils/random-sample";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  buildRegionalAcademyBreadcrumbJsonLd,
  buildRegionalAcademyListJsonLd,
} from "@/lib/seo/regional-academy-jsonld";
import { buildFaqPageJsonLd } from "@/lib/seo/site-jsonld";

export const dynamic = "force-dynamic";

const TOP_PREMIUM_COUNT = 3;

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
  const slugs = await getPublishedRegionalSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  unstable_noStore();
  const { slug } = await params;
  let page = await resolveRegionalLanding(slug);
  if (!page) return {};

  const allPremium = await getAllPremiumAcademies();
  const seoAcademy = sampleRandom(allPremium, 1)[0] ?? null;
  const pageCtx = await loadRegionalPageContext(page);
  const seoCtx = seoAcademy
    ? buildRegionalSeoContext(page.label, seoAcademy, null)
    : pageCtx.seoCtx;

  page = await ensureRegionalSeoContent(page, seoCtx);

  return buildRegionalLandingMetadata(page, seoCtx);
}

export default async function RegionalAcademyLandingPage({ params }: PageProps) {
  unstable_noStore();

  const { slug } = await params;
  const decoded = decodeURIComponent(slug);

  const legacy = LEGACY_SLUG_REDIRECT[decoded];
  if (legacy) {
    redirect(`/services/academy/region/${legacy}`);
  }

  let page = await resolveRegionalLanding(decoded);
  if (!page) notFound();

  const { label, regionBig, query } = page;
  const searchQuery = query ?? label;
  const regionFilter = regionBig ?? "전체";

  const [pageCtx, allPremium] = await Promise.all([
    loadRegionalPageContext(page),
    getAllPremiumAcademies(),
  ]);

  const seoAcademy = sampleRandom(allPremium, 1)[0] ?? null;
  const seoCtx = seoAcademy
    ? buildRegionalSeoContext(label, seoAcademy, null)
    : pageCtx.seoCtx;

  page = await ensureRegionalSeoContent(page, seoCtx);

  const { premium, regular, nearbyPremium } = pageCtx;

  const topPremium = sampleRandom(
    allPremium,
    Math.min(TOP_PREMIUM_COUNT, allPremium.length)
  );
  const guidePreview = sampleRandom(allPremium, 5);

  const nearby = await resolveNearbyPages(page);
  const heroIntro = resolveBoundRegionInfo(page, seoCtx);
  const seoBlocks = resolveBoundSeoBlocks(page, seoCtx);
  const faqItems = resolveBoundFaqItems(page, seoCtx);
  const listAnchor = "#academy-list";
  const listSample = sampleStableRandom(regular, 5, `${page.slug}-list`);

  const featuredAcademy = seoAcademy
    ? {
        name: seoAcademy.name,
        slug: seoAcademy.slug,
        images: getAcademyGalleryImages(seoAcademy, 3),
        regionLabel: seoAcademy.region_small,
        isNearby: !premium.some((a) => a.slug === seoAcademy.slug),
      }
    : null;

  return (
    <main className="w-full min-w-0 max-w-6xl px-4 py-8 sm:px-6 sm:py-10 md:py-14">
      <JsonLd
        data={[
          buildRegionalAcademyListJsonLd(page, pageCtx.all.length),
          buildRegionalAcademyBreadcrumbJsonLd(page),
          buildFaqPageJsonLd(faqItems),
        ]}
      />

      <Link
        href="/services/academy"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        전국 애견미용학원
      </Link>

      <section className="mb-10 text-center md:mb-12">
        <p className="mb-3 inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-primary">
          <MapPin className="h-4 w-4" aria-hidden />
          {label} 지역
        </p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
          {label} 애견미용학원
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted">{heroIntro}</p>
      </section>

      {topPremium.length > 0 ? (
        <section className="mb-12">
          <PremiumAcademyGrid
            academies={topPremium}
            premiumTitle="인증 추천 학원"
            premiumBadge="인증 추천"
          />
        </section>
      ) : premium.length > 0 ? (
        <section className="mb-12">
          <PremiumAcademyGrid
            academies={premium}
            premiumTitle={`${label} 인증 추천 학원`}
            premiumBadge="인증 추천"
          />
        </section>
      ) : (
        <NearbyPremiumAcademyFallback
          label={label}
          academies={nearbyPremium}
        />
      )}

      <RegionalAcademySeoSection
        label={label}
        blocks={seoBlocks}
        intro={resolveBoundSeoSectionIntro(label, seoCtx)}
        featuredAcademy={featuredAcademy}
      />

      <ChairmanConsultBanner regionLabel={label} />
      <OfficialAdvisoryBoardSection />

      <section className="mb-12">
        <AcademyGuideTabs
          region={regionFilter}
          query={searchQuery}
          academies={pageCtx.all}
          previewAcademies={guidePreview}
          listHref={listAnchor}
          totalListCount={regular.length}
          premiumListCount={allPremium.length}
        />
      </section>

      <div id="academy-list">
        <AcademyList
          academies={listSample}
          listTitle={`${label} 애견미용학원 목록`}
          registerLabel={`${label} 학원 정보 등록하기`}
          totalCount={regular.length}
        />
      </div>

      <NearbyRegionalLinks
        currentLabel={label}
        intro={resolveBoundNearbyIntro(page, seoCtx) ?? page.nearbyIntro}
        nearby={nearby}
      />

      {pageCtx.all.length === 0 && (
        <p className="mt-6 text-center text-sm text-muted">
          아직 {label} 지역에 등록된 애견미용학원이 없습니다.
        </p>
      )}

      <div className="mt-12 text-center">
        <Link
          href="/services/academy/register"
          className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-semibold text-primary shadow-[var(--card-shadow)] transition hover:shadow-[var(--card-shadow-hover)]"
        >
          <Plus className="h-4 w-4" />
          {label} 학원 정보 등록하기
        </Link>
      </div>
    </main>
  );
}
