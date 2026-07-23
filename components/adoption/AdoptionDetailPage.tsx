import Link from "next/link";
import { ArrowLeft, ExternalLink, MapPin, Phone, Star } from "lucide-react";
import { ImageSlider } from "@/components/academy/ImageSlider";
import { AcademyOwnerPromoBanner } from "@/components/academy/AcademyOwnerPromoBanner";
import { listingBasePath } from "@/lib/listings/config";
import { getGalleryImages } from "@/lib/listings/queries";
import type { Listing } from "@/lib/types/listing";

function naverMapUrl(listing: Listing): string {
  if (listing.naver_place_url?.startsWith("http")) {
    return listing.naver_place_url;
  }
  return `https://map.naver.com/v5/search/${encodeURIComponent(listing.address)}`;
}

function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function AdoptionDetailPage({ listing }: { listing: Listing }) {
  const basePath = listingBasePath("adoption");
  const images = getGalleryImages(listing, 6);
  const regionLabel = `${listing.region_big} ${listing.region_small}`.trim();
  const mapUrl = naverMapUrl(listing);
  const hasPhone = Boolean(listing.phone?.trim());

  const fieldSections = [
    { title: "분양 안내 · 견종 정보", value: listing.service_info },
    { title: "분양 가격대", value: listing.extra_info },
    { title: "입양·분양 절차", value: listing.extra_info_2 },
  ].filter((s) => s.value);

  return (
    <main
      className={`w-full min-w-0 px-4 py-8 sm:px-6 sm:py-10 ${
        hasPhone ? "pb-28" : "pb-14"
      }`}
    >
      <Link
        href={basePath}
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        강아지분양 목록
      </Link>

      <article>
        <header className="mb-8">
          {listing.is_premium ? (
            <span className="mb-3 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
              <Star className="h-3 w-3 fill-white" />
              추천 분양업체
            </span>
          ) : null}
          <p className="mb-2 text-sm font-medium text-primary">
            {regionLabel} 강아지분양
          </p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            {listing.name}
          </h1>
          {listing.title_copy ? (
            <p className="mt-3 text-lg leading-relaxed text-muted">
              {listing.title_copy}
            </p>
          ) : null}
        </header>

        {images.length > 0 ? (
          <section className="mb-10" aria-label={`${listing.name} 사진`}>
            <ImageSlider images={images} alt={listing.name} />
          </section>
        ) : null}

        <section className="mb-8 overflow-hidden rounded-2xl bg-white shadow-[var(--card-shadow)]">
          <dl className="divide-y divide-gray-50">
            <div className="grid grid-cols-1 gap-1 px-4 py-4 sm:grid-cols-[6.5rem_1fr] sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-muted">지역</dt>
              <dd className="text-sm text-foreground">{regionLabel}</dd>
            </div>
            <div className="grid grid-cols-1 gap-1 px-4 py-4 sm:grid-cols-[6.5rem_1fr] sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-muted">주소</dt>
              <dd className="flex items-start gap-2 text-sm text-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{listing.address}</span>
              </dd>
            </div>
            {listing.phone ? (
              <div className="grid grid-cols-1 gap-1 px-4 py-4 sm:grid-cols-[6.5rem_1fr] sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-muted">연락처</dt>
                <dd className="flex items-start gap-2 text-sm text-foreground">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0" />
                  <a href={telHref(listing.phone)} className="hover:text-primary">
                    {listing.phone}
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>
        </section>

        <div className="mb-8 flex flex-wrap gap-3">
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-800 sm:flex-none sm:min-w-[12rem]"
          >
            <ExternalLink className="h-4 w-4" />
            네이버지도 바로가기
          </a>
          {listing.phone ? (
            <a
              href={telHref(listing.phone)}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white sm:flex-none sm:min-w-[10rem]"
            >
              <Phone className="h-4 w-4" />
              전화하기
            </a>
          ) : null}
        </div>

        {fieldSections.map((section) => (
          <section
            key={section.title}
            className="mb-8 rounded-2xl bg-white p-4 shadow-[var(--card-shadow)] sm:p-6"
          >
            <h2 className="mb-3 text-lg font-bold">{section.title}</h2>
            <p className="whitespace-pre-line leading-relaxed text-muted">
              {section.value}
            </p>
          </section>
        ))}

        <AcademyOwnerPromoBanner
          academyName={listing.name}
          applyHref={`${basePath}/register`}
        />
      </article>

      {listing.phone ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/90">
          <div className="mx-auto flex w-full max-w-[92rem] gap-3">
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-foreground"
            >
              네이버지도
            </a>
            <a
              href={telHref(listing.phone)}
              className="inline-flex h-12 flex-[1.4] items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white shadow-sm"
            >
              <Phone className="h-4 w-4" />
              {listing.phone} 전화
            </a>
          </div>
        </div>
      ) : null}
    </main>
  );
}
