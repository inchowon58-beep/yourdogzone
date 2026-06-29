import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase/client";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 3600;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const title = decodeURIComponent(slug).replace(/-/g, " ");

  return {
    title,
    description: `${title}에 대한 상세 정보 — 유아독존`,
  };
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

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        홈으로
      </Link>

      <article>
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight">{data.title}</h1>
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
            <table className="w-full text-sm">
              <tbody>
                {data.info_rows.map((row: { label: string; value: string }) => (
                  <tr key={row.label} className="border-b border-gray-50 last:border-0">
                    <th className="w-1/3 bg-gray-50/50 px-6 py-4 text-left font-medium text-muted">
                      {row.label}
                    </th>
                    <td className="px-6 py-4 text-foreground">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {"body" in data && data.body && (
          <section className="rounded-2xl bg-white p-8 shadow-[var(--card-shadow)]">
            <p className="leading-relaxed text-muted whitespace-pre-line">{data.body}</p>
          </section>
        )}
      </article>
    </main>
  );
}
