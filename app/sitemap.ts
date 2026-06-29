import type { MetadataRoute } from "next";
import { SERVICES } from "@/lib/constants/services";
import { absoluteUrl } from "@/lib/site/config";
import { getLandingPages } from "@/lib/seo/landing-pages";
import { getAcademies } from "@/lib/academy/queries";

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

  return [...STATIC_ROUTES, ...serviceRoutes, ...academyRoutes, ...landingRoutes];
}
