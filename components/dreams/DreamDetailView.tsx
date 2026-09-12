import Link from "next/link";
import {
  animalLabel,
  DREAM_ARTICLES,
  getDreamBySlug,
} from "@/lib/dreams/catalog";
import type { DreamArticle } from "@/lib/dreams/types";
import type { DreamLongform } from "@/lib/dreams/longform-types";
import { DreamLongformView } from "@/components/dreams/DreamLongformView";
import { Callout } from "@/components/tools/ToolUi";

export function DreamDetailView({
  article,
  longform,
}: {
  article: DreamArticle;
  longform: DreamLongform;
}) {
  const related = article.relatedSlugs
    .map((s) => getDreamBySlug(s))
    .filter(Boolean)
    .slice(0, 4) as DreamArticle[];

  const sameAnimal = DREAM_ARTICLES.filter(
    (a) => a.animal === article.animal && a.slug !== article.slug
  ).slice(0, 6);

  return (
    <article className="space-y-6">
      <DreamLongformView longform={longform} showHeadline={false} />

      <div className="grid gap-2 sm:grid-cols-2">
        <Link
          href="/dreams"
          className="rounded-2xl border border-[#e5dcd3] bg-white px-4 py-4 text-center text-sm font-bold text-[#2c2a3a]"
        >
          꿈 해몽 툴로 바로 해석하기 →
        </Link>
        <Link
          href="/tools/love-score"
          className="rounded-2xl bg-[#f3e6e6] px-4 py-4 text-center text-sm font-bold text-[#5c3030]"
        >
          우리 강아지 사랑 포인트 확인 →
        </Link>
        <Link
          href="/tools/petshop-curation"
          className="rounded-2xl bg-[#eef1f8] px-4 py-4 text-center text-sm font-bold text-[#2c3a5c] sm:col-span-2"
        >
          유아독존 안심 제휴처 · 펫샵선택도우미 →
        </Link>
      </div>

      {related.length || sameAnimal.length ? (
        <section>
          <h2 className="mb-3 px-1 text-lg font-black text-[#2c2a3a]">
            함께 읽으면 좋은 꿈 해몽
          </h2>
          <ul className="space-y-2">
            {[...related, ...sameAnimal]
              .filter(
                (a, i, arr) => arr.findIndex((x) => x.slug === a.slug) === i
              )
              .slice(0, 8)
              .map((a) => (
                <li key={a.slug}>
                  <Link
                    href={`/dreams/${a.slug}`}
                    className="block rounded-2xl border border-[#e8ddd4] bg-white px-4 py-3 text-sm font-semibold text-[#2c2a3a] hover:bg-[#fbf7f3]"
                  >
                    {a.title}
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      ) : null}

      <Callout tone="info" title={`${animalLabel(article.animal)} 꿈 해몽 안내`}>
        본 콘텐츠는 AI·심리 상담 톤의 참고용 해몽입니다. 불안이 오래 가거나 아이
        건강이 걱정되면 전문가와 상담해 주세요.
      </Callout>
    </article>
  );
}
