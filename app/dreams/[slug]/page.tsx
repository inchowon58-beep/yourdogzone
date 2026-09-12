import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { DreamDetailView } from "@/components/dreams/DreamDetailView";
import {
  animalLabel,
  getDreamBySlug,
} from "@/lib/dreams/catalog";
import { getOrGenerateDreamLongform } from "@/lib/dreams/longform-store";
import { buildPageMetadata } from "@/lib/seo/metadata";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = true;

/** 최초 요청 시 Gemini 생성 가능하도록 동적 허용 */
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  // 빌드 시 전 페이지 Gemini 호출은 비용·시간 부담 → on-demand 생성
  return [] as { slug: string }[];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getDreamBySlug(slug);
  if (!article) return {};
  return buildPageMetadata({
    title: article.title,
    description: article.description,
    path: `/dreams/${article.slug}`,
    ogSubtitle: `${animalLabel(article.animal)} 꿈 해몽`,
    keywords: article.keywords,
  });
}

export default async function DreamDetailPage({ params }: Props) {
  const { slug } = await params;
  const article = getDreamBySlug(slug);
  if (!article) notFound();

  const longform = await getOrGenerateDreamLongform(slug);

  return (
    <main className="w-full min-w-0 px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/dreams"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        꿈 해몽소로
      </Link>

      <p className="text-xs font-bold tracking-wide text-[#b88a8a]">
        유아독존 · {animalLabel(article.animal)} 꿈 해몽
        {longform.source === "gemini" ? " · AI 롱폼" : ""}
      </p>
      <h1 className="mt-2 text-2xl font-black tracking-tight text-[#2c2a3a] sm:text-3xl sm:leading-snug">
        {article.title}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-[#6b6578] sm:text-[15px] sm:leading-7">
        {longform.summaryBox.slice(0, 160)}
        {longform.summaryBox.length > 160 ? "…" : ""}
      </p>

      <div className="mt-8">
        <DreamDetailView article={article} longform={longform} />
      </div>
    </main>
  );
}
