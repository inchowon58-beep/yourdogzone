import { LISTING_CATEGORIES, LISTING_CATEGORY_CONFIG } from "@/lib/listings/config";

export type AdminOverviewStats = {
  academy: { total: number; premium: number };
  regionalPages: { total: number; published: number };
  listings: Record<string, { total: number; premium: number }>;
  breeds: number;
};

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
