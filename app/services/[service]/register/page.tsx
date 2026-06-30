import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ListingRegisterForm } from "@/components/listing/ListingRegisterForm";
import {
  getListingConfig,
  isListingCategory,
  listingBasePath,
} from "@/lib/listings/config";
import { buildPageMetadata } from "@/lib/seo/metadata";
import type { ListingCategory } from "@/lib/types/listing";

type PageProps = {
  params: Promise<{ service: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { service } = await params;
  if (!isListingCategory(service)) return { title: "등록" };
  const config = getListingConfig(service);
  return buildPageMetadata({
    title: `${config.singular} 정보 등록`,
    description: `${config.title} 정보를 등록하면 고유 URL 상세 페이지가 생성됩니다.`,
    path: `${listingBasePath(service)}/register`,
    noIndex: true,
  });
}

export default async function ListingRegisterPage({ params }: PageProps) {
  const { service } = await params;
  if (!isListingCategory(service)) notFound();

  const category = service as ListingCategory;
  const config = getListingConfig(category);
  const basePath = listingBasePath(category);

  return (
    <main className="w-full min-w-0 max-w-2xl px-4 py-8 sm:px-6 sm:py-10 md:py-14">
      <Link
        href={basePath}
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {config.title} 목록
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold md:text-3xl">{config.singular} 정보 등록</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          정보를 입력하면 고유 URL의 상세 페이지가 자동으로 생성되고 검색엔진에
          알림(IndexNow)이 전송됩니다.
        </p>
      </div>

      <ListingRegisterForm category={category} />
    </main>
  );
}
