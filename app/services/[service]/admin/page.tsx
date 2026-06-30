import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ListingAdminPanel } from "@/components/listing/ListingAdminPanel";
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
  if (!isListingCategory(service)) return { title: "관리" };
  const config = getListingConfig(service);
  return buildPageMetadata({
    title: `${config.title} 관리`,
    description: `${config.title} 관리자 페이지`,
    path: `${listingBasePath(service)}/admin`,
    noIndex: true,
  });
}

export default async function ListingAdminPage({ params }: PageProps) {
  const { service } = await params;
  if (!isListingCategory(service)) notFound();

  const category = service as ListingCategory;
  const config = getListingConfig(category);
  const basePath = listingBasePath(category);

  return (
    <main className="w-full min-w-0 max-w-4xl px-4 py-8 sm:px-6 sm:py-10 md:py-14">
      <Link
        href={basePath}
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {config.title} 목록으로
      </Link>
      <ListingAdminPanel category={category} />
    </main>
  );
}
