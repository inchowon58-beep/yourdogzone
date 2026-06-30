import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { getAcademies } from "@/lib/academy/queries";
import { AcademySearchBar } from "@/components/academy/AcademySearchBar";
import { RegionTabs } from "@/components/academy/RegionTabs";
import { PremiumAcademyGrid } from "@/components/academy/PremiumAcademyGrid";
import { AcademyList } from "@/components/academy/AcademyList";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  buildAcademyListBreadcrumbJsonLd,
  buildAcademyListJsonLd,
} from "@/lib/seo/academy-jsonld";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "전국 애견미용학원 정보 통합 검색",
  description:
    "서울·경기·인천 등 전국 애견미용학원을 지역별로 검색하세요. 인증 추천 학원, 교육과정, 수강료, 위치 정보를 한곳에서 확인할 수 있습니다.",
  path: "/services/academy",
  keywords: [
    "애견미용학원",
    "전국 애견미용학원",
    "애견미용 학원 추천",
    "애견미용 자격증",
    "반려견 미용 교육",
    "지역별 애견미용학원",
  ],
});

type PageProps = {
  searchParams: Promise<{ region?: string; q?: string }>;
};

export default async function AcademyPage({ searchParams }: PageProps) {
  const { region = "전체", q } = await searchParams;
  const all = await getAcademies({ region, query: q });
  const premium = all.filter((a) => a.is_premium);
  const regular = all.filter((a) => !a.is_premium);

  return (
    <main className="mx-auto w-full min-w-0 max-w-6xl px-4 py-8 sm:px-6 sm:py-10 md:py-14">
      <JsonLd
        data={[buildAcademyListJsonLd(all.length), buildAcademyListBreadcrumbJsonLd()]}
      />

      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        홈으로
      </Link>

      <section className="mb-10 text-center md:mb-14">
        <p className="mb-3 text-sm font-semibold text-primary">
          Pet Grooming Academy
        </p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
          전국 애견미용학원
          <br />
          정보 통합 검색
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-base text-muted">
          지역별 애견미용학원을 한눈에 비교하고, 인증 추천 학원의 상세 정보를
          확인하세요.
        </p>
        <div className="mt-8 flex w-full min-w-0 justify-center">
          <Suspense fallback={null}>
            <AcademySearchBar defaultQuery={q} />
          </Suspense>
        </div>
      </section>

      <section className="mb-8">
        <RegionTabs activeRegion={region} query={q} />
      </section>

      {premium.length > 0 && (
        <section className="mb-12">
          <PremiumAcademyGrid academies={premium} />
        </section>
      )}

      <AcademyList academies={regular} />

      <div className="mt-12 text-center">
        <Link
          href="/services/academy/register"
          className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-semibold text-primary shadow-[var(--card-shadow)] transition hover:shadow-[var(--card-shadow-hover)]"
        >
          <Plus className="h-4 w-4" />
          학원 정보 등록하기
        </Link>
      </div>
    </main>
  );
}
