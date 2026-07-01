import { getAcademies } from "@/lib/academy/queries";
import { getAllRegionalLandings } from "@/lib/academy/regional-store";
import { LISTING_CATEGORIES, LISTING_CATEGORY_CONFIG } from "@/lib/listings/config";
import { getListings } from "@/lib/listings/queries";
import { getBreeds } from "@/lib/breeds/queries";

export type AdminOverviewStats = {
  academy: { total: number; premium: number };
  regionalPages: { total: number; published: number };
  listings: Record<string, { total: number; premium: number }>;
  breeds: number;
};

export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
  const [academies, regional, breeds] = await Promise.all([
    getAcademies(),
    getAllRegionalLandings({ includeUnpublished: true }),
    getBreeds(),
  ]);

  const listings: AdminOverviewStats["listings"] = {};
  await Promise.all(
    LISTING_CATEGORIES.map(async (cat) => {
      const items = await getListings(cat);
      listings[cat] = {
        total: items.length,
        premium: items.filter((i) => i.is_premium).length,
      };
    })
  );

  return {
    academy: {
      total: academies.length,
      premium: academies.filter((a) => a.is_premium).length,
    },
    regionalPages: {
      total: regional.length,
      published: regional.filter((p) => p.isPublished).length,
    },
    listings,
    breeds: breeds.length,
  };
}

export const SERVICE_ADMIN_LINKS = [
  {
    id: "academy",
    title: "애견미용학원",
    href: "/services/academy/admin",
    publicHref: "/services/academy",
  },
  ...LISTING_CATEGORIES.map((cat) => ({
    id: cat,
    title: LISTING_CATEGORY_CONFIG[cat].title,
    href: `/services/${cat}/admin`,
    publicHref: `/services/${cat}`,
  })),
  {
    id: "breeds",
    title: "견종소개",
    href: "/dognose/admin",
    publicHref: "/dognose",
  },
] as const;
