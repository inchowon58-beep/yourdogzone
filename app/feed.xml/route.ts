import { SERVICES } from "@/lib/constants/services";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  absoluteUrl,
  getSiteUrl,
} from "@/lib/site/config";
import { getLandingPages } from "@/lib/seo/landing-pages";
import { getAcademies } from "@/lib/academy/queries";

export const revalidate = 3600;

type RssItem = {
  title: string;
  link: string;
  description: string;
  pubDate: Date;
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toRfc822(date: Date): string {
  return date.toUTCString();
}

function buildRssXml(items: RssItem[]): string {
  const siteUrl = getSiteUrl();
  const channelItems = items
    .map(
      (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <guid isPermaLink="true">${escapeXml(item.link)}</guid>
      <description>${escapeXml(item.description)}</description>
      <pubDate>${toRfc822(item.pubDate)}</pubDate>
    </item>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>ko</language>
    <lastBuildDate>${toRfc822(new Date())}</lastBuildDate>
    <atom:link href="${escapeXml(absoluteUrl("/feed.xml"))}" rel="self" type="application/rss+xml"/>
${channelItems}
  </channel>
</rss>`;
}

async function getRssItems(): Promise<RssItem[]> {
  const now = new Date();
  const staticItems: RssItem[] = [
    {
      title: `${SITE_NAME} 홈`,
      link: absoluteUrl("/"),
      description: SITE_DESCRIPTION,
      pubDate: now,
    },
    {
      title: "견종소개",
      link: absoluteUrl("/dognose"),
      description: "견종 딕셔너리 및 가이드",
      pubDate: now,
    },
    {
      title: "강아지 Q&A",
      link: absoluteUrl("/qna"),
      description: "반려견에 대한 궁금증 커뮤니티",
      pubDate: now,
    },
  ];

  const serviceItems: RssItem[] = SERVICES.filter((s) =>
    s.href.startsWith("/services/")
  ).map((service) => ({
    title: service.title,
    link: absoluteUrl(service.href),
    description: service.description,
    pubDate: now,
  }));

  const landingPages = await getLandingPages();
  const landingItems: RssItem[] = landingPages.map((page) => ({
    title: page.title,
    link: absoluteUrl(`/dynamic-landing/${encodeURIComponent(page.slug)}`),
    description:
      page.subtitle ?? page.body?.slice(0, 200) ?? `${page.title} — ${SITE_NAME}`,
    pubDate: page.updated_at ? new Date(page.updated_at) : now,
  }));

  const academies = await getAcademies();
  const academyItems: RssItem[] = academies.map((academy) => ({
    title: `${academy.name} | ${academy.region_small} 애견미용학원`,
    link: absoluteUrl(`/services/academy/${academy.slug}`),
    description: academy.title_copy,
    pubDate: academy.updated_at ? new Date(academy.updated_at) : now,
  }));

  return [...academyItems, ...landingItems, ...staticItems, ...serviceItems];
}

export async function GET() {
  const items = await getRssItems();
  const xml = buildRssXml(items);

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
