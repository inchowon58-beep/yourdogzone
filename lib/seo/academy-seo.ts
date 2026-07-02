import type { Metadata } from "next";
import type { Academy } from "@/lib/types/academy";
import { absoluteUrl, SITE_NAME } from "@/lib/site/config";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildAcademyOgImageUrl } from "@/lib/seo/og-image";
import { ACADEMY_OG_SUBTITLE } from "@/lib/seo/og-image-render";

export type AcademySeoContent = {
  title: string;
  description: string;
  keywords: string[];
  h1: string;
  subtitle: string;
  ogImageAlt: string;
  path: string;
};

function trimDescription(text: string, max = 155): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trim()}…`;
}

/** 업체명·지역 기반 동적 SEO 문구 */
export function buildAcademySeoContent(academy: Academy): AcademySeoContent {
  const regionLabel = `${academy.region_small} ${academy.region_big}`;
  const path = `/services/academy/${academy.slug}`;

  const baseTitle = `${academy.name} | ${regionLabel} 애견미용학원`;
  const suffix = academy.seo_title_suffix?.trim();
  const title = suffix ? `${baseTitle} | ${suffix}` : baseTitle;

  const description = trimDescription(
    [
      `${academy.name} — ${regionLabel} 애견미용학원.`,
      academy.title_copy,
      academy.phone ? `문의 ${academy.phone}.` : null,
      `교육과정, 수강료, 주소(${academy.address}) 안내.`,
      `${SITE_NAME}에서 확인하세요.`,
    ]
      .filter(Boolean)
      .join(" ")
  );

  const keywords = [
    academy.name,
    `${academy.name} 애견미용학원`,
    `${academy.name} 애견미용`,
    `${academy.region_small} ${academy.name}`,
    `${academy.name} ${academy.region_small}`,
    `${academy.region_small} 애견미용학원`,
    `${academy.region_big} 애견미용학원`,
    `${academy.region_small} 애견미용`,
    `${regionLabel} 애견미용학원`,
    "애견미용학원",
    "반려견 미용 학원",
    "애견미용 자격증",
    academy.is_premium ? `${academy.name} 추천` : `${academy.name} 정보`,
    SITE_NAME,
  ];

  if (suffix) {
    keywords.push(suffix, `${academy.name} ${suffix}`);
  }

  return {
    title,
    description,
    keywords: [...new Set(keywords)],
    h1: academy.name,
    subtitle: `${regionLabel} 애견미용학원 · ${academy.title_copy}`,
    ogImageAlt: `${academy.name} ${regionLabel} 애견미용학원 사진`,
    path,
  };
}

export function buildAcademyDetailMetadata(academy: Academy): Metadata {
  const seo = buildAcademySeoContent(academy);
  const base = buildPageMetadata({
    title: seo.title,
    description: seo.description,
    path: seo.path,
    keywords: seo.keywords,
    ogSubtitle: ACADEMY_OG_SUBTITLE,
    imageAlt: seo.ogImageAlt,
    type: "article",
  });

  return {
    ...base,
    title: {
      absolute: `${seo.title} | ${SITE_NAME}`,
    },
    openGraph: {
      ...base.openGraph,
      title: `${seo.title} | ${SITE_NAME}`,
    },
    twitter: {
      ...base.twitter,
      title: `${seo.title} | ${SITE_NAME}`,
    },
  };
}

/** @deprecated buildAcademySeoContent 사용 */
export function buildAcademyDetailKeywords(academy: Academy): string[] {
  return buildAcademySeoContent(academy).keywords;
}

export function buildAcademyWebPageJsonLd(
  academy: Academy,
  _images: string[]
) {
  const seo = buildAcademySeoContent(academy);
  const pageUrl = absoluteUrl(seo.path);
  const brandedOg = buildAcademyOgImageUrl();

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": pageUrl,
    name: seo.title,
    headline: academy.name,
    description: seo.description,
    url: pageUrl,
    inLanguage: "ko-KR",
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: absoluteUrl("/"),
    },
    about: {
      "@type": "EducationalOrganization",
      name: academy.name,
      address: {
        "@type": "PostalAddress",
        streetAddress: academy.address,
        addressLocality: academy.region_small,
        addressRegion: academy.region_big,
        addressCountry: "KR",
      },
    },
    image: brandedOg,
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: brandedOg,
      width: 1200,
      height: 630,
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "홈", item: absoluteUrl("/") },
        {
          "@type": "ListItem",
          position: 2,
          name: "애견미용학원",
          item: absoluteUrl("/services/academy"),
        },
        { "@type": "ListItem", position: 3, name: academy.name, item: pageUrl },
      ],
    },
  };
}
