import { SERVICES } from "@/lib/constants/services";
import { HOME_TOOLS } from "@/lib/constants/tools";
import { absoluteUrl } from "@/lib/site/config";
import { getLandingPages } from "@/lib/seo/landing-pages";
import {
  LISTING_CATEGORIES,
  listingBasePath,
} from "@/lib/listings/config";
import type { ListingCategory } from "@/lib/types/listing";
import { getListings } from "@/lib/listings/queries";
import { getAcademies } from "@/lib/academy/queries";
import { getAllRegionalLandings } from "@/lib/academy/regional-landing";
import { regionalLandingPath } from "@/lib/academy/regional-path";
import { getBreeds } from "@/lib/breeds/queries";
import { breedDetailPath } from "@/lib/breeds/config";
import { PET_FOODS } from "@/lib/tools/foods";
import { HEALTH_GUIDES } from "@/lib/health";
import type { SitemapChunkName, SitemapEntry } from "@/lib/seo/sitemap-types";

const STATIC_ROUTES: SitemapEntry[] = [
  { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
  { url: absoluteUrl("/health"), changeFrequency: "weekly", priority: 0.9 },
  { url: absoluteUrl("/dognose"), changeFrequency: "weekly", priority: 0.8 },
  { url: absoluteUrl("/qna"), changeFrequency: "daily", priority: 0.8 },
  {
    url: absoluteUrl("/services/academy"),
    changeFrequency: "daily",
    priority: 0.9,
  },
  {
    url: absoluteUrl("/services/academy/register"),
    changeFrequency: "monthly",
    priority: 0.5,
  },
  ...HOME_TOOLS.filter((t) => t.href !== "/health").map((tool) => ({
    url: absoluteUrl(tool.href),
    changeFrequency: "monthly" as const,
    priority: 0.85,
  })),
];

function parseListingChunkName(name: SitemapChunkName): ListingCategory | null {
  const prefix = "listings-";
  if (!name.startsWith(prefix)) return null;
  const category = name.slice(prefix.length);
  return LISTING_CATEGORIES.includes(category as ListingCategory)
    ? (category as ListingCategory)
    : null;
}

async function buildStaticEntries(): Promise<SitemapEntry[]> {
  const serviceRoutes: SitemapEntry[] = SERVICES.filter(
    (s) => s.href.startsWith("/services/") && s.id !== "academy"
  ).map((service) => ({
    url: absoluteUrl(service.href),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const breeds = await getBreeds();
  const breedRoutes: SitemapEntry[] = breeds.map((breed) => ({
    url: absoluteUrl(breedDetailPath(breed.slug)),
    lastModified: breed.updated_at ? new Date(breed.updated_at) : undefined,
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  const foodRoutes: SitemapEntry[] = PET_FOODS.map((food) => ({
    url: absoluteUrl(`/tools/food/${food.slug}`),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const healthRoutes: SitemapEntry[] = HEALTH_GUIDES.map((guide) => ({
    url: absoluteUrl(`/health/${guide.slug}`),
    changeFrequency: "monthly" as const,
    priority: 0.72,
  }));

  return [
    ...STATIC_ROUTES,
    ...serviceRoutes,
    ...breedRoutes,
    ...foodRoutes,
    ...healthRoutes,
  ];
}

async function buildAcademyEntries(): Promise<SitemapEntry[]> {
  const academies = await getAcademies();
  return academies.map((academy) => ({
    url: absoluteUrl(`/services/academy/${academy.slug}`),
    lastModified: academy.updated_at ? new Date(academy.updated_at) : undefined,
    changeFrequency: "weekly" as const,
    priority: academy.is_premium ? 0.85 : 0.75,
  }));
}

async function buildRegionalEntries(): Promise<SitemapEntry[]> {
  const regionalPages = await getAllRegionalLandings();
  return regionalPages.map((page) => ({
    url: absoluteUrl(regionalLandingPath(page)),
    lastModified: page.updatedAt ? new Date(page.updatedAt) : undefined,
    changeFrequency: "weekly" as const,
    priority: 0.88,
  }));
}

async function buildLandingEntries(): Promise<SitemapEntry[]> {
  const landingPages = await getLandingPages();
  return landingPages.map((page) => ({
    url: absoluteUrl(`/dynamic-landing/${encodeURIComponent(page.slug)}`),
    lastModified: page.updated_at ? new Date(page.updated_at) : undefined,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));
}

async function buildListingEntries(category: ListingCategory): Promise<SitemapEntry[]> {
  const listings = await getListings(category);
  return listings.map((item) => ({
    url: absoluteUrl(`${listingBasePath(category)}/${item.slug}`),
    lastModified: item.updated_at ? new Date(item.updated_at) : undefined,
    changeFrequency: "weekly" as const,
    priority: item.is_premium ? 0.85 : 0.75,
  }));
}

/** 청크별로 필요한 데이터만 조회 — 단일 대용량 sitemap보다 응답이 빠름 */
export async function buildSitemapChunk(
  name: SitemapChunkName
): Promise<SitemapEntry[]> {
  if (name === "static") return buildStaticEntries();
  if (name === "academy") return buildAcademyEntries();
  if (name === "regional") return buildRegionalEntries();
  if (name === "landing") return buildLandingEntries();

  const listingCategory = parseListingChunkName(name);
  if (listingCategory) return buildListingEntries(listingCategory);

  return [];
}

export function chunkPublicUrl(name: SitemapChunkName): string {
  return absoluteUrl(`/sitemaps/${name}.xml`);
}
