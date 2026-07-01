import "server-only";

import { getAcademies } from "@/lib/academy/queries";
import { getAllRegionalLandings } from "@/lib/academy/regional-store";
import { LISTING_CATEGORIES } from "@/lib/listings/config";
import { getListings } from "@/lib/listings/queries";
import { getBreeds } from "@/lib/breeds/queries";
import type { AdminOverviewStats } from "@/lib/admin/service-links";

export type { AdminOverviewStats } from "@/lib/admin/service-links";

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
