import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Phone, Star } from "lucide-react";
import { getAcademyBySlug, getAcademySlugs } from "@/lib/academy/queries";
import { getAcademyGalleryImages } from "@/lib/academy/images";
import { absoluteUrl } from "@/lib/site/config";
import { ImageSlider } from "@/components/academy/ImageSlider";
import { PremiumCtaBar } from "@/components/academy/PremiumCtaBar";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  buildAcademyBreadcrumbJsonLd,
  buildAcademyLocalBusinessJsonLd,
} from "@/lib/seo/academy-jsonld";
import {
  buildAcademyDetailMetadata,
  buildAcademySeoContent,
  buildAcademyWebPageJsonLd,
} from "@/lib/seo/academy-seo";

export const revalidate = 3600;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await getAcademySlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const academy = await getAcademyBySlug(slug);
  if (!academy) return { title: "학원을 찾을 수 없습니다" };

  const images = getAcademyGalleryImages(academy, 3);
  return buildAcademyDetailMetadata(academy, images);
}

export default async function AcademyDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const academy = await getAcademyBySlug(slug);
  if (!academy) notFound();

  const images = getAcademyGalleryImages(academy, 3);
  const seo = buildAcademySeoContent(academy);
  const mapQuery = encodeURIComponent(academy.address);
  const isPremium = academy.is_premium;
  const regionLabel = `${academy.region_big} ${academy.region_small}`;

  return (
    <main
      className={`mx-auto max-w-4xl px-6 py-10 ${isPremium ? "pb-4" : "pb-14"}`}
    >
      <JsonLd
        data={[
          buildAcademyBreadcrumbJsonLd(academy),
          buildAcademyWebPageJsonLd(academy, images),
          buildAcademyLocalBusinessJsonLd(academy, images),
        ]}
      />

      <Link
        href="/services/academy"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        학원 목록
      </Link>

      <article itemScope itemType="https://schema.org/EducationalOrganization">
        <meta itemProp="name" content={academy.name} />
        <meta itemProp="description" content={seo.description} />
        <link itemProp="url" href={absoluteUrl(seo.path)} />

        <header
          className={`mb-8 ${isPremium ? "rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-white p-6" : ""}`}
        >
          {isPremium && (
            <span className="mb-3 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
              <Star className="h-3 w-3 fill-white" />
              인증 추천 학원
            </span>
          )}
          <p className="mb-2 text-sm font-medium text-primary">
            {regionLabel} 애견미용학원
          </p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            {seo.h1}
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-muted">
            {academy.title_copy}
          </p>
        </header>

        <section className="mb-10" aria-label={`${academy.name} 사진`}>
          <ImageSlider images={images} alt={academy.name} />
        </section>

        <section
          className="mb-10 overflow-hidden rounded-2xl bg-white shadow-[var(--card-shadow)]"
          itemProp="address"
          itemScope
          itemType="https://schema.org/PostalAddress"
        >
          <table className="w-full text-sm">
            <tbody>
              <InfoRow label="지역" value={regionLabel} />
              <InfoRow
                label="주소"
                value={academy.address}
                icon={<MapPin className="h-4 w-4" />}
              />
              <meta itemProp="streetAddress" content={academy.address} />
              <meta itemProp="addressLocality" content={academy.region_small} />
              <meta itemProp="addressRegion" content={academy.region_big} />
              <meta itemProp="addressCountry" content="KR" />
              {academy.phone && (
                <InfoRow
                  label="연락처"
                  value={academy.phone}
                  icon={<Phone className="h-4 w-4" />}
                />
              )}
            </tbody>
          </table>
        </section>

        {academy.curriculum && (
          <ContentSection title={`${academy.name} 교육 과정`}>
            <p className="whitespace-pre-line leading-relaxed text-muted">
              {academy.curriculum}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              {academy.name}은(는) {regionLabel} 지역에서 애견미용 자격증 취득,
              취업, 창업을 목표로 하는 수강생들에게 체계적인 커리큘럼을 제공합니다.
            </p>
          </ContentSection>
        )}

        {academy.tuition_info && (
          <ContentSection title={`${academy.name} 수강료 안내`}>
            <p className="whitespace-pre-line leading-relaxed text-muted">
              {academy.tuition_info}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              {academy.name} 수강료 및 국비지원(내일배움카드 등) 대상 여부는 학원에
              직접 문의하시면 정확한 안내를 받으실 수 있습니다.
            </p>
          </ContentSection>
        )}

        <ContentSection title={`${academy.name} 오시는 길`}>
          <p className="mb-4 text-sm text-muted">{academy.address}</p>
          <div className="overflow-hidden rounded-xl bg-gray-100">
            <iframe
              title={`${academy.name} 위치 — ${regionLabel}`}
              src={`https://maps.google.com/maps?q=${mapQuery}&output=embed`}
              className="h-72 w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            {regionLabel}에 위치한 {academy.name}으로 방문 상담이 가능합니다.
            네이버 지도·카카오맵에서 &quot;{academy.name}&quot;을 검색해 보세요.
          </p>
        </ContentSection>

        <section className="mt-10 rounded-2xl bg-gray-50 p-6 text-sm leading-relaxed text-muted">
          <p>
            <strong className="text-foreground">{academy.name}</strong>은(는){" "}
            {regionLabel} 애견미용학원으로, 반려견 미용사 자격증 취득과 실무 교육을
            전문으로 합니다. 유아독존에서 전국 애견미용학원 정보를 비교해 보세요.
          </p>
        </section>
      </article>

      {isPremium && <PremiumCtaBar academy={academy} />}
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
    <tr className="border-b border-gray-50 last:border-0">
      <th className="w-28 bg-gray-50/50 px-6 py-4 text-left font-medium text-muted">
        {label}
      </th>
      <td className="px-6 py-4 text-foreground">
        <span className="flex items-center gap-2">
          {icon}
          {value}
        </span>
      </td>
    </tr>
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
    <section className="mb-8 rounded-2xl bg-white p-6 shadow-[var(--card-shadow)] sm:p-8">
      <h2 className="mb-4 text-xl font-bold text-foreground">{title}</h2>
      {children}
    </section>
  );
}
