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

export const MAIN_ADMIN_SECTIONS = [
  ...SERVICE_ADMIN_LINKS,
  {
    id: "care-intake",
    title: "안심입소 신청",
    publicHref: "/care-matching",
  },
  {
    id: "care-shelter-partners",
    title: "보호소 파트너",
    publicHref: "/care-matching/partner",
  },
  {
    id: "regional",
    title: "지역 SEO 페이지",
    publicHref: "/services/academy",
  },
  {
    id: "advisory",
    title: "공식 자문단 위원장",
    publicHref: "/services/academy/advisory",
  },
] as const;

export type MainAdminSectionId = (typeof MAIN_ADMIN_SECTIONS)[number]["id"];
