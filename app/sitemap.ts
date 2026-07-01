import type { MetadataRoute } from "next";
import { SERVICES } from "@/lib/constants/services";
import { absoluteUrl } from "@/lib/site/config";
import { getLandingPages } from "@/lib/seo/landing-pages";
import { LISTING_CATEGORIES, listingBasePath } from "@/lib/listings/config";
import { getListings } from "@/lib/listings/queries";
import { getAcademies } from "@/lib/academy/queries";
import { getAllRegionalLandings } from "@/lib/academy/regional-landing";
import { regionalLandingPath } from "@/lib/academy/regional-path";
import { getBreeds } from "@/lib/breeds/queries";
import { breedDetailPath } from "@/lib/breeds/config";

export const revalidate = 3600;

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
  { url: absoluteUrl("/dognose"), changeFrequency: "weekly", priority: 0.8 },
  { url: absoluteUrl("/qna"), changeFrequency: "daily", priority: 0.8 },
  { url: absoluteUrl("/services/academy"), changeFrequency: "daily", priority: 0.9 },
  { url: absoluteUrl("/services/academy/register"), changeFrequency: "monthly", priority: 0.5 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const serviceRoutes: MetadataRoute.Sitemap = SERVICES.filter(
    (s) => s.href.startsWith("/services/") && s.id !== "academy"
  ).map((service) => ({
    url: absoluteUrl(service.href),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const landingPages = await getLandingPages();
  const landingRoutes: MetadataRoute.Sitemap = landingPages.map((page) => ({
    url: absoluteUrl(`/dynamic-landing/${encodeURIComponent(page.slug)}`),
    lastModified: page.updated_at ? new Date(page.updated_at) : undefined,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const academies = await getAcademies();
  const academyRoutes: MetadataRoute.Sitemap = academies.map((academy) => ({
    url: absoluteUrl(`/services/academy/${academy.slug}`),
    lastModified: academy.updated_at ? new Date(academy.updated_at) : undefined,
    changeFrequency: "weekly" as const,
    priority: academy.is_premium ? 0.85 : 0.75,
  }));

  const regionalPages = await getAllRegionalLandings();
  const regionalAcademyRoutes: MetadataRoute.Sitemap = regionalPages.map(
    (page) => ({
      url: absoluteUrl(regionalLandingPath(page)),
      lastModified: page.updatedAt ? new Date(page.updatedAt) : undefined,
      changeFrequency: "weekly" as const,
      priority: 0.88,
    })
  );

  const listingRoutes: MetadataRoute.Sitemap = [];
  for (const category of LISTING_CATEGORIES) {
    const listings = await getListings(category);
    for (const item of listings) {
      listingRoutes.push({
        url: absoluteUrl(`${listingBasePath(category)}/${item.slug}`),
        lastModified: item.updated_at ? new Date(item.updated_at) : undefined,
        changeFrequency: "weekly" as const,
        priority: item.is_premium ? 0.85 : 0.75,
      });
    }
  }

  const breeds = await getBreeds();
  const breedRoutes: MetadataRoute.Sitemap = breeds.map((breed) => ({
    url: absoluteUrl(breedDetailPath(breed.slug)),
    lastModified: breed.updated_at ? new Date(breed.updated_at) : undefined,
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  return [
    ...STATIC_ROUTES,
    ...serviceRoutes,
    ...academyRoutes,
    ...regionalAcademyRoutes,
    ...listingRoutes,
    ...breedRoutes,
    ...landingRoutes,
  ];
}
