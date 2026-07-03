import {
  resolveNearbyAreas,
  resolveNearbyStations,
} from "@/lib/academy/resolve-nearby-areas";
import type { RegionalLandingPage } from "@/lib/types/regional-landing";
import { regionalLandingPath } from "@/lib/academy/regional-path";
import { absoluteUrl, SITE_NAME } from "@/lib/site/config";
import { buildAcademyOgImageUrl } from "@/lib/seo/og-image";
import {
  getRegionalServiceConfig,
  resolvePageCategory,
} from "@/lib/seo/regional-service-config";

export function buildRegionalAcademyListJsonLd(
  page: RegionalLandingPage,
  entityCount: number
) {
  const category = resolvePageCategory(page);
  const config = getRegionalServiceConfig(category);
  const serviceTitle = config.title;
  const url = absoluteUrl(regionalLandingPath(page));
  const nearbyAreas = resolveNearbyAreas(page);
  const nearbyStations = resolveNearbyStations(page);
  const brandedOg = buildAcademyOgImageUrl();

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${page.label} ${serviceTitle}`,
    image: brandedOg,
    description: [
      `${page.label} 지역 ${serviceTitle} 목록, ${config.premiumLabel}, 이용 안내.`,
      nearbyAreas.length > 0
        ? `근방 지역: ${nearbyAreas.map((a) => `${a} ${serviceTitle}`).join(", ")}.`
        : null,
      nearbyStations.length > 0
        ? `인근 지하철역: ${nearbyStations.map((s) => `${s} ${serviceTitle}`).join(", ")}.`
        : null,
    ]
      .filter(Boolean)
      .join(" "),
    url,
    inLanguage: "ko-KR",
    keywords: [
      `${page.label} ${serviceTitle}`,
      ...nearbyAreas.map((a) => `${a} ${serviceTitle}`),
      ...nearbyStations.map((s) => `${s} ${serviceTitle}`),
    ].join(", "),
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: absoluteUrl("/"),
    },
    numberOfItems: entityCount,
    about: {
      "@type": "Thing",
      name: `${page.label} ${serviceTitle}`,
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
          name: `${area} ${serviceTitle}`,
          address: {
            "@type": "PostalAddress",
            addressCountry: "KR",
            addressLocality: area,
            ...(page.regionBig ? { addressRegion: page.regionBig } : {}),
          },
        })),
        ...nearbyStations.map((station) => ({
          "@type": "Place",
          name: `${station} ${serviceTitle}`,
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
              name: `${area} ${serviceTitle}`,
              description: `${page.label} 인근 ${area} ${serviceTitle} 검색·비교 안내`,
              position: i + 1,
            })),
            ...nearbyStations.map((station, i) => ({
              "@type": "WebPage",
              name: `${station} ${serviceTitle}`,
              description: `${page.label} 인근 ${station} 지하철역 ${serviceTitle} 검색·비교 안내`,
              position: nearbyAreas.length + i + 1,
            })),
          ],
        }
      : {}),
  };
}

export function buildRegionalAcademyBreadcrumbJsonLd(page: RegionalLandingPage) {
  const category = resolvePageCategory(page);
  const config = getRegionalServiceConfig(category);
  const serviceTitle = config.title;
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
        name: serviceTitle,
        item: absoluteUrl(config.basePath),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `${page.label} ${serviceTitle}`,
        item: url,
      },
    ],
  };
}
