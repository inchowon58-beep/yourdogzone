import type { RegionalLandingPage } from "@/lib/academy/regional-landing";
import { regionalLandingPath } from "@/lib/academy/regional-landing";
import { absoluteUrl, SITE_NAME } from "@/lib/site/config";

export function buildRegionalAcademyListJsonLd(
  page: RegionalLandingPage,
  academyCount: number
) {
  const url = absoluteUrl(regionalLandingPath(page));

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${page.label} 애견미용학원`,
    description: `${page.label} 지역 애견미용학원 목록, 인증 추천 학원, 수강료·자격증·실습 환경 안내.`,
    url,
    inLanguage: "ko-KR",
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: absoluteUrl("/"),
    },
    numberOfItems: academyCount,
    about: {
      "@type": "Thing",
      name: `${page.label} 애견미용학원`,
      areaServed: {
        "@type": "Place",
        name: page.label,
        address: {
          "@type": "PostalAddress",
          addressCountry: "KR",
          ...(page.regionBig ? { addressRegion: page.regionBig } : {}),
        },
      },
    },
  };
}

export function buildRegionalAcademyBreadcrumbJsonLd(page: RegionalLandingPage) {
  const url = absoluteUrl(regionalLandingPath(page));

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "홈",
        item: absoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "애견미용학원",
        item: absoluteUrl("/services/academy"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `${page.label} 애견미용학원`,
        item: url,
      },
    ],
  };
}
