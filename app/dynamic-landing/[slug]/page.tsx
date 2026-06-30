import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/lib/site/config";
import { buildPageMetadata } from "@/lib/seo/metadata";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 3600;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const title = decodeURIComponent(slug).replace(/-/g, " ");
  const path = `/dynamic-landing/${encodeURIComponent(slug)}`;

  return buildPageMetadata({
    title,
    description: `${title} 관련 반려견 정보 — 유아독존에서 애견미용학원, 분양, 병원 등 지역 정보를 확인하세요.`,
    path,
    keywords: [title, "반려견", "강아지", "유아독존"],
  });
}

async function getLandingData(slug: string) {
  const supabase = createSupabaseClient();

  if (supabase) {
    const { data } = await supabase
      .from("landing_pages")
      .select("*")
      .eq("slug", slug)
      .single();

    if (data) return data;
  }

  const title = decodeURIComponent(slug).replace(/-/g, " ");
  return {
    slug,
    title,
    subtitle: `${title} 관련 정보를 유아독존에서 확인하세요.`,
    images: [] as string[],
    info_rows: [
      { label: "카테고리", value: "반려견 정보" },
      { label: "제공", value: "유아독존" },
    ],
    body: `${title}에 대해 알아보세요. 유아독존은 반려견 관련 신뢰할 수 있는 정보를 제공합니다. 애견미용학원, 분양, 보호소, 동물병원 등 다양한 서비스를 한곳에서 이용할 수 있습니다.`,
  };
}

export default async function DynamicLandingPage({ params }: PageProps) {
  const { slug } = await params;
  if (!slug) notFound();

  const data = await getLandingData(slug);
  const pageUrl = absoluteUrl(`/dynamic-landing/${encodeURIComponent(slug)}`);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: data.title,
    description:
      "subtitle" in data && data.subtitle
        ? String(data.subtitle)
        : `${data.title} — 유아독존`,
    url: pageUrl,
    inLanguage: "ko-KR",
    isPartOf: {
      "@type": "WebSite",
      name: "유아독존",
      url: absoluteUrl("/"),
    },
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <JsonLd data={jsonLd} />

      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        홈으로
      </Link>

      <article>
        <header className="mb-10">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{data.title}</h1>
          {"subtitle" in data && data.subtitle && (
            <p className="mt-3 text-lg text-muted">{data.subtitle}</p>
          )}
        </header>

        {"images" in data && Array.isArray(data.images) && data.images.length > 0 && (
          <section className="mb-10 overflow-hidden rounded-2xl bg-white shadow-[var(--card-shadow)]">
            <div className="flex gap-2 overflow-x-auto p-4">
              {data.images.map((src: string, i: number) => (
                <div
                  key={i}
                  className="h-48 w-72 shrink-0 rounded-xl bg-gray-100"
                  style={{ backgroundImage: `url(${src})`, backgroundSize: "cover" }}
                />
              ))}
            </div>
          </section>
        )}

        {"info_rows" in data && Array.isArray(data.info_rows) && (
          <section className="mb-10 overflow-hidden rounded-2xl bg-white shadow-[var(--card-shadow)]">
            <dl className="divide-y divide-gray-50">
              {data.info_rows.map((row: { label: string; value: string }) => (
                <div
                  key={row.label}
                  className="grid grid-cols-1 gap-1 px-4 py-4 sm:grid-cols-[6.5rem_1fr] sm:items-start sm:gap-4 sm:px-6"
                >
                  <dt className="text-sm font-medium text-muted">{row.label}</dt>
                  <dd className="text-sm text-foreground break-words">{row.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {"body" in data && data.body && (
          <section className="rounded-2xl bg-white p-4 shadow-[var(--card-shadow)] sm:p-8">
            <p className="leading-relaxed text-muted whitespace-pre-line">{data.body}</p>
          </section>
        )}
      </article>
    </main>
  );
}
