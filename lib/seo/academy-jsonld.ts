import type { Academy } from "@/lib/types/academy";
import { absoluteUrl, SITE_NAME } from "@/lib/site/config";
import { buildAcademySeoContent } from "@/lib/seo/academy-seo";

export { buildAcademyDetailKeywords } from "@/lib/seo/academy-seo";

export function buildAcademyBreadcrumbJsonLd(academy: Academy) {
  const pageUrl = absoluteUrl(`/services/academy/${academy.slug}`);

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
        name: academy.name,
        item: pageUrl,
      },
    ],
  };
}

export function buildAcademyLocalBusinessJsonLd(
  academy: Academy,
  images: string[]
) {
  const pageUrl = absoluteUrl(`/services/academy/${academy.slug}`);
  const areaName = `${academy.region_big} ${academy.region_small}`;
  const seo = buildAcademySeoContent(academy);

  return {
    "@context": "https://schema.org",
    "@type": ["EducationalOrganization", "LocalBusiness"],
    "@id": pageUrl,
    name: academy.name,
    alternateName: `${academy.name} 애견미용학원`,
    description: seo.description,
    url: pageUrl,
    image: images.length ? images : undefined,
    telephone: academy.phone ?? undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: academy.address,
      addressLocality: academy.region_small,
      addressRegion: academy.region_big,
      addressCountry: "KR",
    },
    areaServed: {
      "@type": "Place",
      name: areaName,
      address: {
        "@type": "PostalAddress",
        addressLocality: academy.region_small,
        addressRegion: academy.region_big,
        addressCountry: "KR",
      },
    },
    parentOrganization: {
      "@type": "Organization",
      name: SITE_NAME,
      url: absoluteUrl("/"),
    },
    ...(academy.curriculum
      ? {
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "교육 과정",
            itemListElement: [
              {
                "@type": "Offer",
                itemOffered: {
                  "@type": "Course",
                  name: `${academy.name} 애견미용 교육`,
                  description: academy.curriculum,
                },
              },
            ],
          },
        }
      : {}),
  };
}

export function buildAcademyListJsonLd(academyCount: number) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "전국 애견미용학원 정보",
    description:
      "지역별 애견미용학원 검색, 인증 추천 학원, 교육과정 및 수강료 안내.",
    url: absoluteUrl("/services/academy"),
    inLanguage: "ko-KR",
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: absoluteUrl("/"),
    },
    numberOfItems: academyCount,
    about: {
      "@type": "Thing",
      name: "애견미용학원",
      areaServed: {
        "@type": "Country",
        name: "대한민국",
      },
    },
  };
}

export function buildAcademyListBreadcrumbJsonLd() {
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
    ],
  };
}
