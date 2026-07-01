import {
  resolveNearbyAreas,
  resolveNearbyStations,
} from "@/lib/academy/resolve-nearby-areas";
import type { RegionalLandingPage } from "@/lib/types/regional-landing";
import { regionalLandingPath } from "@/lib/academy/regional-path";
import { absoluteUrl, SITE_NAME } from "@/lib/site/config";

export function buildRegionalAcademyListJsonLd(
  page: RegionalLandingPage,
  academyCount: number
) {
  const url = absoluteUrl(regionalLandingPath(page));
  const nearbyAreas = resolveNearbyAreas(page);
  const nearbyStations = resolveNearbyStations(page);

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${page.label} 애견미용학원`,
    description: [
      `${page.label} 지역 애견미용학원 목록, 인증 추천 학원, 수강료·자격증·실습 환경 안내.`,
      nearbyAreas.length > 0
        ? `근방 지역: ${nearbyAreas.map((a) => `${a} 애견미용학원`).join(", ")}.`
        : null,
      nearbyStations.length > 0
        ? `인근 지하철역: ${nearbyStations.map((s) => `${s} 애견미용학원`).join(", ")}.`
        : null,
    ]
      .filter(Boolean)
      .join(" "),
    url,
    inLanguage: "ko-KR",
    keywords: [
      `${page.label} 애견미용학원`,
      ...nearbyAreas.map((a) => `${a} 애견미용학원`),
      ...nearbyStations.map((s) => `${s} 애견미용학원`),
    ].join(", "),
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: absoluteUrl("/"),
    },
    numberOfItems: academyCount,
    about: {
      "@type": "Thing",
      name: `${page.label} 애견미용학원`,
      areaServed: [
        {
          "@type": "Place",
          name: page.label,
          address: {
            "@type": "PostalAddress",
            addressCountry: "KR",
            ...(page.regionBig ? { addressRegion: page.regionBig } : {}),
          },
        },
        ...nearbyAreas.map((area) => ({
          "@type": "Place",
          name: `${area} 애견미용학원`,
          address: {
            "@type": "PostalAddress",
            addressCountry: "KR",
            addressLocality: area,
            ...(page.regionBig ? { addressRegion: page.regionBig } : {}),
          },
        })),
        ...nearbyStations.map((station) => ({
          "@type": "Place",
          name: `${station} 애견미용학원`,
          address: {
            "@type": "PostalAddress",
            addressCountry: "KR",
            addressLocality: station,
            ...(page.regionBig ? { addressRegion: page.regionBig } : {}),
          },
        })),
      ],
    },
    ...((nearbyAreas.length > 0 || nearbyStations.length > 0)
      ? {
          hasPart: [
            ...nearbyAreas.map((area, i) => ({
              "@type": "WebPage",
              name: `${area} 애견미용학원`,
              description: `${page.label} 인근 ${area} 애견미용학원 검색·비교 안내`,
              position: i + 1,
            })),
            ...nearbyStations.map((station, i) => ({
              "@type": "WebPage",
              name: `${station} 애견미용학원`,
              description: `${page.label} 인근 ${station} 지하철역 애견미용학원 검색·비교 안내`,
              position: nearbyAreas.length + i + 1,
            })),
          ],
        }
      : {}),
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
