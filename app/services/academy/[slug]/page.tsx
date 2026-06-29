import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Phone, Star } from "lucide-react";
import { getAcademyBySlug, getAcademySlugs } from "@/lib/academy/queries";
import { getAcademyGalleryImages } from "@/lib/academy/images";
import { absoluteUrl } from "@/lib/site/config";
import { ImageSlider } from "@/components/academy/ImageSlider";
import { PremiumCtaBar } from "@/components/academy/PremiumCtaBar";

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

  const title = `${academy.name} | ${academy.region_small} ${academy.region_big} 애견미용학원 추천`;
  const description = `${academy.region_big} ${academy.region_small} ${academy.name} — ${academy.title_copy}. 교육과정, 수강료, 위치 정보를 확인하세요.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/services/academy/${academy.slug}`),
      images: academy.logo_image ? [academy.logo_image] : undefined,
    },
  };
}

export default async function AcademyDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const academy = await getAcademyBySlug(slug);
  if (!academy) notFound();

  const images = getAcademyGalleryImages(academy, 3);

  const mapQuery = encodeURIComponent(academy.address);
  const isPremium = academy.is_premium;

  return (
    <main
      className={`mx-auto max-w-4xl px-6 py-10 ${isPremium ? "pb-4" : "pb-14"}`}
    >
      <Link
        href="/services/academy"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        학원 목록
      </Link>

      <article>
        <header
          className={`mb-8 ${isPremium ? "rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-white p-6" : ""}`}
        >
          {isPremium && (
            <span className="mb-3 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
              <Star className="h-3 w-3 fill-white" />
              인증 추천 학원
            </span>
          )}
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            {academy.name}
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-muted">
            {academy.title_copy}
          </p>
        </header>

        <section className="mb-10">
          <ImageSlider images={images} alt={academy.name} />
        </section>

        <section className="mb-10 overflow-hidden rounded-2xl bg-white shadow-[var(--card-shadow)]">
          <table className="w-full text-sm">
            <tbody>
              <InfoRow label="지역" value={`${academy.region_big} ${academy.region_small}`} />
              <InfoRow label="주소" value={academy.address} icon={<MapPin className="h-4 w-4" />} />
              {academy.phone && (
                <InfoRow label="연락처" value={academy.phone} icon={<Phone className="h-4 w-4" />} />
              )}
            </tbody>
          </table>
        </section>

        {academy.curriculum && (
          <ContentSection title="교육 과정 상세 안내">
            <p className="whitespace-pre-line leading-relaxed text-muted">
              {academy.curriculum}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              {academy.name}은(는) {academy.region_big} {academy.region_small} 지역에서
              애견미용 자격증 취득, 취업, 창업을 목표로 하는 수강생들에게 체계적인
              커리큘럼을 제공합니다. 실습 중심의 교육으로 현장에서 바로 활용 가능한
              기술을 습득할 수 있습니다.
            </p>
          </ContentSection>
        )}

        {academy.tuition_info && (
          <ContentSection title="수강료 및 국비지원 혜택">
            <p className="whitespace-pre-line leading-relaxed text-muted">
              {academy.tuition_info}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              국비지원(내일배움카드 등) 대상 여부는 학원에 직접 문의하시면 정확한
              안내를 받으실 수 있습니다. 조기 등록 할인, 재수강 혜택 등 다양한 프로모션이
              진행 중일 수 있습니다.
            </p>
          </ContentSection>
        )}

        <ContentSection title="오시는 길">
          <p className="mb-4 text-sm text-muted">{academy.address}</p>
          <div className="overflow-hidden rounded-xl bg-gray-100">
            <iframe
              title={`${academy.name} 위치`}
              src={`https://maps.google.com/maps?q=${mapQuery}&output=embed`}
              className="h-72 w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            {academy.region_big} {academy.region_small}에 위치한 {academy.name}으로
            방문 상담이 가능합니다. 대중교통 이용 시 네이버 지도 또는 카카오맵에서
            &quot;{academy.name}&quot;을 검색해 최적의 경로를 확인하세요.
          </p>
        </ContentSection>

        <section className="mt-10 rounded-2xl bg-gray-50 p-6 text-sm leading-relaxed text-muted">
          <p>
            <strong className="text-foreground">{academy.name}</strong>은(는){" "}
            {academy.region_big} {academy.region_small} 지역의 애견미용학원으로,
            반려견 미용사 자격증 취득과 실무 교육을 전문으로 합니다. 유아독존에서
            전국 애견미용학원 정보를 비교하고 상세 정보를 확인해 보세요.
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
