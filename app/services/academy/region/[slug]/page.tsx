import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, MapPin, Plus } from "lucide-react";
import { getAcademies } from "@/lib/academy/queries";
import { PremiumAcademyGrid } from "@/components/academy/PremiumAcademyGrid";
import { AcademyGuideTabs } from "@/components/academy/AcademyGuideTabs";
import { AcademyList } from "@/components/academy/AcademyList";
import { RegionalAcademySeoSection } from "@/components/academy/RegionalAcademySeoSection";
import { NearbyPremiumAcademyFallback } from "@/components/academy/NearbyPremiumAcademyFallback";
import { NearbyRegionalLinks } from "@/components/academy/NearbyRegionalLinks";
import { fetchNearbyPremiumAcademies } from "@/lib/academy/nearby-premium-academies";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  buildRegionalGuideFaqItems,
  buildRegionalSeoContent,
} from "@/lib/academy/regional-seo-content";
import { buildRegionalLandingMetadata } from "@/lib/academy/regional-seo-metadata";
import {
  getPublishedRegionalSlugs,
  resolveRegionalLanding,
} from "@/lib/academy/regional-landing";
import { resolveNearbyPages } from "@/lib/academy/regional-store";
import {
  buildRegionalAcademyBreadcrumbJsonLd,
  buildRegionalAcademyListJsonLd,
} from "@/lib/seo/regional-academy-jsonld";
import { buildFaqPageJsonLd } from "@/lib/seo/site-jsonld";

export const revalidate = 3600;

/** 구 한글 URL → 영문 슬러그 리다이렉트 */
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
  const { slug } = await params;
  const page = await resolveRegionalLanding(slug);
  if (!page) return {};
  return buildRegionalLandingMetadata(page);
}

export default async function RegionalAcademyLandingPage({ params }: PageProps) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);

  const legacy = LEGACY_SLUG_REDIRECT[decoded];
  if (legacy) {
    redirect(`/services/academy/region/${legacy}`);
  }

  const page = await resolveRegionalLanding(decoded);
  if (!page) notFound();

  const { label, regionBig, query } = page;
  const searchQuery = query ?? label;
  const regionFilter = regionBig ?? "전체";

  const [all, nearby] = await Promise.all([
    getAcademies({ region: regionFilter, query: searchQuery }),
    resolveNearbyPages(page),
  ]);

  const premium = all.filter((a) => a.is_premium);
  const regular = all.filter((a) => !a.is_premium);
  const nearbyPremium =
    premium.length === 0
      ? await fetchNearbyPremiumAcademies(nearby, 3)
      : [];
  const seoBlocks = buildRegionalSeoContent(page);
  const listAnchor = "#academy-list";

  return (
    <main className="w-full min-w-0 max-w-6xl px-4 py-8 sm:px-6 sm:py-10 md:py-14">
      <JsonLd
        data={[
          buildRegionalAcademyListJsonLd(page, all.length),
          buildRegionalAcademyBreadcrumbJsonLd(page),
          buildFaqPageJsonLd(buildRegionalGuideFaqItems(page)),
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
        <p className="mx-auto mt-4 max-w-xl text-base text-muted">
          {page.regionInfo ??
            `${label} 지역 애견미용학원을 한곳에서 비교하세요.`}
        </p>
      </section>

      {premium.length > 0 ? (
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

      <RegionalAcademySeoSection label={label} blocks={seoBlocks} />

      <section className="mb-12">
        <AcademyGuideTabs
          region={regionFilter}
          query={searchQuery}
          academies={all}
          listHref={listAnchor}
        />
      </section>

      <div id="academy-list">
        <AcademyList
          academies={regular}
          listTitle={`${label} 애견미용학원 목록`}
          registerLabel={`${label} 학원 정보 등록하기`}
        />
      </div>

      <NearbyRegionalLinks
        currentLabel={label}
        intro={page.nearbyIntro}
        nearby={nearby}
      />

      {all.length === 0 && (
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
