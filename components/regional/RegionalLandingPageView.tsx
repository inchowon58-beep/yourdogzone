import Link from "next/link";
import { ArrowLeft, MapPin, Phone, Plus } from "lucide-react";
import { PremiumAcademyGrid } from "@/components/academy/PremiumAcademyGrid";
import { AcademyGuideTabs } from "@/components/academy/AcademyGuideTabs";
import { AcademyList } from "@/components/academy/AcademyList";
import { RegionalAcademySeoSection } from "@/components/academy/RegionalAcademySeoSection";
import { ShelterRegionalTrustGuide } from "@/components/regional/ShelterRegionalTrustGuide";
import { AdoptionRegionalTrustGuide } from "@/components/regional/AdoptionRegionalTrustGuide";
import { RecentRegionalPostsScroll } from "@/components/regional/RecentRegionalPostsScroll";
import { ChairmanConsultBanner } from "@/components/academy/ChairmanConsultBanner";
import { OfficialAdvisoryBanner } from "@/components/academy/OfficialAdvisoryBanner";
import { NearbyDistrictSeoSection } from "@/components/academy/NearbyDistrictSeoSection";
import { NearbyPremiumAcademyFallback } from "@/components/academy/NearbyPremiumAcademyFallback";
import type { RegionalPageBundle } from "@/lib/academy/regional-page-loader";
import {
  resolveBoundFaqItems,
  resolveBoundRegionInfo,
  resolveBoundSeoBlocks,
  resolveBoundSeoSectionIntro,
} from "@/lib/academy/regional-seo-resolve";
import { getAcademyGalleryImages } from "@/lib/academy/images";
import { NearbyStationSeoSection } from "@/components/academy/NearbyStationSeoSection";
import { resolveNearbyAreas, resolveNearbyStations } from "@/lib/academy/resolve-nearby-areas";
import { sampleStableRandom } from "@/lib/utils/random-sample";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  buildRegionalAcademyBreadcrumbJsonLd,
  buildRegionalAcademyListJsonLd,
} from "@/lib/seo/regional-academy-jsonld";
import { buildFaqPageJsonLd } from "@/lib/seo/site-jsonld";
import {
  extractRegionalKeywordTheme,
  getRegionalServiceConfig,
  resolvePageCategory,
} from "@/lib/seo/regional-service-config";
import { isAdoptionTrustLayout, isShelterTrustLayout } from "@/lib/academy/regional-layout-version";

type Props = {
  bundle: RegionalPageBundle;
};

export function RegionalLandingPageView({ bundle }: Props) {
  const { page, pageCtx, relatedPages } = bundle;
  const category = resolvePageCategory(page);
  const config = getRegionalServiceConfig(category);
  const { label, regionBig, query } = page;
  const searchQuery = query ?? label;
  const regionFilter = regionBig ?? "전체";
  const seoCtx = pageCtx.seoCtx;
  const useShelterTrust = isShelterTrustLayout(page);
  const useAdoptionTrust = isAdoptionTrustLayout(page);
  const useTrustGuide = useShelterTrust || useAdoptionTrust;

  const {
    premium,
    regular,
    nearbyPremium,
    isNearbyFallback,
    nearbySourceLabel,
    recommended,
    seoNearby,
    isPoolPremiumFallback,
  } = pageCtx;

  const topPremiumAcademies = recommended
    ? [recommended]
    : nearbyPremium.length > 0
      ? nearbyPremium.slice(0, 1)
      : [];

  const guidePreview = sampleStableRandom(
    recommended ? [recommended] : nearbyPremium.length > 0 ? nearbyPremium : premium,
    5,
    `${page.slug}-guide`
  );

  const nearbyAreas = resolveNearbyAreas(page);
  const nearbyStations = resolveNearbyStations(page);
  const heroIntro = resolveBoundRegionInfo(page, seoCtx);
  const seoBlocks = useTrustGuide
    ? []
    : resolveBoundSeoBlocks(page, seoCtx);
  const faqItems = resolveBoundFaqItems(page, seoCtx);
  const listAnchor = "#entity-list";
  const listSample = sampleStableRandom(regular, 5, `${page.slug}-list`);

  const featuredSource = recommended ?? seoNearby ?? null;
  const featuredAcademy = featuredSource
    ? {
        name: featuredSource.name,
        slug: featuredSource.slug,
        images: getAcademyGalleryImages(featuredSource, 3),
        regionLabel: featuredSource.region_small,
        isNearby: !recommended,
      }
    : null;
  const shelterCtaPhone =
    category === "shelter" && featuredSource?.phone
      ? featuredSource.phone.replace(/-/g, "")
      : null;
  const adoptionCtaPhone =
    category === "adoption" && featuredSource?.phone
      ? featuredSource.phone.replace(/-/g, "")
      : null;
  const fixedCtaPhone = shelterCtaPhone || adoptionCtaPhone;
  const isCatAdoptionForm =
    page.formId === "cat_basic" ||
    [
      "maine_coon",
      "nevskaya_masquerade",
      "munchkin",
      "ragdoll",
      "russian_blue",
    ].includes(page.formId ?? "");
  const fixedCtaLabel =
    category === "shelter"
      ? `강아지파양(입소) 무료분양 : 인증추천업체 ${featuredSource?.phone ?? ""}`
      : `${isCatAdoptionForm ? "고양이분양" : "강아지분양"} : 인증추천업체 ${featuredSource?.phone ?? ""}`;

  const pageKeyword =
    page.keyword?.trim() || `${label} ${config.title}`;
  const keywordTheme = extractRegionalKeywordTheme(
    pageKeyword,
    label,
    category
  );

  const listTitle = isNearbyFallback
    ? `${nearbySourceLabel ?? "인근"} ${config.title} (${label} 인근)`
    : `${label} ${config.title} 목록`;

  return (
    <main className="w-full min-w-0 px-4 py-8 sm:px-6 sm:py-10 md:py-14">
      <JsonLd
        data={[
          buildRegionalAcademyListJsonLd(page, pageCtx.all.length),
          buildRegionalAcademyBreadcrumbJsonLd(page),
          buildFaqPageJsonLd(faqItems),
        ]}
      />

      <Link
        href={config.basePath}
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {config.listBackLabel}
      </Link>

      <section className="mb-10 text-center md:mb-12">
        <p className="mb-3 inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-primary">
          <MapPin className="h-4 w-4" aria-hidden />
          {label} 지역
        </p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
          {pageKeyword}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted">{heroIntro}</p>
      </section>

      {recommended ? (
        <section className="mb-12">
          <PremiumAcademyGrid
            academies={[recommended]}
            servicePath={config.basePath}
            premiumTitle={`${label} ${config.premiumLabel}`}
            premiumBadge="인증 추천"
          />
        </section>
      ) : topPremiumAcademies.length > 0 ? (
        <NearbyPremiumAcademyFallback
          label={label}
          academies={topPremiumAcademies}
          isPoolFallback={isPoolPremiumFallback}
          entityLabel={config.entityLabel}
          servicePath={config.basePath}
        />
      ) : null}

      {useShelterTrust ? (
        <ShelterRegionalTrustGuide
          label={label}
          pageKeyword={pageKeyword}
          seedKey={page.slug}
          faqItems={faqItems}
          coverImageUrl={page.imageUrl}
        />
      ) : useAdoptionTrust ? (
        <AdoptionRegionalTrustGuide
          label={label}
          pageKeyword={pageKeyword}
          seedKey={page.slug}
          faqItems={faqItems}
          coverImageUrl={page.imageUrl}
          formId={page.formId}
          recommendedName={featuredSource?.name}
        />
      ) : (
        <RegionalAcademySeoSection
          label={label}
          pageKeyword={pageKeyword}
          blocks={seoBlocks}
          intro={resolveBoundSeoSectionIntro(label, seoCtx, category)}
          featuredAcademy={featuredAcademy}
          coverImageUrl={page.imageUrl}
          serviceTitle={config.title}
          servicePath={config.basePath}
          entityLabel={config.entityLabel}
          guideSectionTitle={config.guideSectionTitle}
        />
      )}

      {category === "academy" ? (
        <>
          <ChairmanConsultBanner regionLabel={label} />
          <OfficialAdvisoryBanner />
        </>
      ) : null}

      {category === "academy" ? (
        <section className="mb-12">
          <AcademyGuideTabs
            region={regionFilter}
            query={searchQuery}
            academies={pageCtx.all}
            previewAcademies={guidePreview}
            listHref={listAnchor}
            totalListCount={regular.length}
            premiumListCount={
              recommended ? 1 : nearbyPremium.length > 0 ? nearbyPremium.length : premium.length
            }
          />
        </section>
      ) : null}

      <div id="entity-list">
        <AcademyList
          academies={listSample}
          servicePath={config.basePath}
          listTitle={listTitle}
          registerLabel={`${label} ${config.entityLabel} 정보 등록하기`}
          totalCount={regular.length}
          isNearbyFallback={isNearbyFallback}
          nearbySourceLabel={nearbySourceLabel}
          regionLabel={label}
        />
      </div>

      <NearbyDistrictSeoSection
        currentLabel={label}
        areas={nearbyAreas}
        keywordSuffix={keywordTheme}
      />

      <NearbyStationSeoSection
        currentLabel={label}
        stations={nearbyStations}
        keywordSuffix={keywordTheme}
      />

      {useTrustGuide ? (
        <RecentRegionalPostsScroll
          currentLabel={label}
          pages={relatedPages ?? []}
        />
      ) : null}

      {pageCtx.all.length === 0 && (
        <p className="mt-6 text-center text-sm text-muted">
          아직 {label} 지역에 {config.emptyEntityMessage}.
        </p>
      )}

      <div className="mt-12 text-center">
        <Link
          href={config.registerPath}
          className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-semibold text-primary shadow-[var(--card-shadow)] transition hover:shadow-[var(--card-shadow-hover)]"
        >
          <Plus className="h-4 w-4" />
          {label} {config.entityLabel} 정보 등록하기
        </Link>
      </div>

      {fixedCtaPhone && featuredSource?.phone ? (
        <>
          <div className="h-24 sm:h-20" aria-hidden />
          <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-emerald-100 bg-white/95 px-3 py-2.5 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-md sm:px-4 sm:py-3">
            <div className="mx-auto flex w-full max-w-[92rem] items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground">
                  {fixedCtaLabel}
                </p>
                <p className="truncate text-xs text-emerald-700">
                  {featuredSource.name}
                </p>
              </div>
              <a
                href={`tel:${fixedCtaPhone}`}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white"
              >
                <Phone className="h-4 w-4" />
                전화하기
              </a>
            </div>
          </div>
        </>
      ) : null}
    </main>
  );
}
