import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Phone, Star } from "lucide-react";
import { ImageSlider } from "@/components/academy/ImageSlider";
import { AcademyOwnerPromoBanner } from "@/components/academy/AcademyOwnerPromoBanner";
import {
  getListingConfig,
  isListingCategory,
  listingBasePath,
  listingDetailPath,
} from "@/lib/listings/config";
import { getGalleryImages, getListingBySlug } from "@/lib/listings/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildCategoryOgSubtitle } from "@/lib/seo/og-image-render";
import type { ListingCategory } from "@/lib/types/listing";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

type PageProps = {
  params: Promise<{ service: string; slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { service, slug } = await params;
  if (!isListingCategory(service)) return { title: "찾을 수 없습니다" };
  const listing = await getListingBySlug(service, slug);
  if (!listing) return { title: "찾을 수 없습니다" };
  const config = getListingConfig(service);
  return buildPageMetadata({
    title: `${listing.name} | ${listing.region_big} ${config.title}`,
    description: listing.title_copy || `${listing.name} ${config.title}`,
    path: listingDetailPath(service, listing.slug),
    keywords: [listing.name, config.title, listing.region_big, listing.region_small],
    ogSubtitle: buildCategoryOgSubtitle(config.title),
    imageAlt: `${listing.name} ${config.title} 사진`,
  });
}

export default async function ListingDetailPage({ params }: PageProps) {
  const { service, slug } = await params;
  if (!isListingCategory(service)) notFound();

  const category = service as ListingCategory;
  const config = getListingConfig(category);
  const basePath = listingBasePath(category);
  const listing = await getListingBySlug(category, slug);
  if (!listing) notFound();

  const images = getGalleryImages(listing, 3);
  const regionLabel = `${listing.region_big} ${listing.region_small}`;
  const mapQuery = encodeURIComponent(listing.address);
  const fieldSections = config.fields
    .map((field) => ({
      title: field.label,
      value: listing[field.key],
    }))
    .filter((section) => section.value);

  return (
    <main
      className={`w-full min-w-0 px-4 py-8 sm:px-6 sm:py-10 ${listing.is_premium ? "pb-4" : "pb-14"}`}
    >
      <Link
        href={basePath}
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {config.title} 목록
      </Link>

      <article>
        <header
          className={`mb-8 ${listing.is_premium ? "rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-white p-6" : ""}`}
        >
          {listing.is_premium && (
            <span className="mb-3 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
              <Star className="h-3 w-3 fill-white" />
              {config.premiumLabel}
            </span>
          )}
          <p className="mb-2 text-sm font-medium text-primary">
            {regionLabel} {config.title}
          </p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            {listing.name}
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-muted">{listing.title_copy}</p>
        </header>

        {images.length > 0 && (
          <section className="mb-10" aria-label={`${listing.name} 사진`}>
            <ImageSlider images={images} alt={listing.name} />
          </section>
        )}

        <section className="mb-10 overflow-hidden rounded-2xl bg-white shadow-[var(--card-shadow)]">
          <dl className="divide-y divide-gray-50">
            <InfoRow label="지역" value={regionLabel} />
            <InfoRow
              label="주소"
              value={listing.address}
              icon={<MapPin className="h-4 w-4 shrink-0" />}
            />
            {listing.phone && (
              <InfoRow
                label="연락처"
                value={listing.phone}
                icon={<Phone className="h-4 w-4 shrink-0" />}
              />
            )}
          </dl>
        </section>

        {fieldSections.map((section) => (
          <ContentSection key={section.title} title={section.title}>
            <p className="whitespace-pre-line leading-relaxed text-muted">
              {section.value}
            </p>
          </ContentSection>
        ))}

        <ContentSection title={`${listing.name} 오시는 길`}>
          <p className="mb-4 text-sm text-muted">{listing.address}</p>
          <div className="overflow-hidden rounded-xl bg-gray-100">
            <iframe
              title={`${listing.name} 위치`}
              src={`https://maps.google.com/maps?q=${mapQuery}&output=embed`}
              className="h-72 w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </ContentSection>

        <section className="mt-10 rounded-2xl bg-gray-50 p-6 text-sm leading-relaxed text-muted">
          <p>
            <strong className="text-foreground">{listing.name}</strong> — {regionLabel}{" "}
            {config.title}. 유아독존에서 전국 {config.title} 정보를 비교해 보세요.
          </p>
        </section>

        <AcademyOwnerPromoBanner
          academyName={listing.name}
          applyHref={`${basePath}/register`}
        />
      </article>
    </main>
  );
}

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-1 px-4 py-4 sm:grid-cols-[6.5rem_1fr] sm:items-start sm:gap-4 sm:px-6">
      <dt className="text-sm font-medium text-muted">{label}</dt>
      <dd className="text-sm text-foreground break-words">
        <span className="flex items-start gap-2">
          {icon}
          <span>{value}</span>
        </span>
      </dd>
    </div>
  );
}

function ContentSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8 rounded-2xl bg-white p-4 shadow-[var(--card-shadow)] sm:p-6 md:p-8">
      <h2 className="mb-4 text-lg font-bold text-foreground sm:text-xl">{title}</h2>
      {children}
    </section>
  );
}
