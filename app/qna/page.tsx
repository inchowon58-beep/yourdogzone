import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildFaqPageJsonLd } from "@/lib/seo/site-jsonld";
import { buildPageMetadata } from "@/lib/seo/metadata";

const SAMPLE_QNA = [
  {
    question: "강아지 첫 산책은 언제부터 가능한가요?",
    answer:
      "예방접종이 완료된 후, 보통 16주 전후부터 짧은 산책을 시작하는 것이 권장됩니다. 수의사와 상담 후 진행하세요.",
  },
  {
    question: "사료는 하루에 몇 번 급여해야 하나요?",
    answer:
      "연령과 견종에 따라 다르지만, 성견은 보통 하루 2회 급여가 일반적입니다. 포장지 권장량을 참고하세요.",
  },
  {
    question: "강아지 미용은 몇 주마다 해야 하나요?",
    answer:
      "견종과 털 길이에 따라 4~8주 간격이 일반적입니다. 장모종은 더 자주, 단모종은 덜 자주 미용할 수 있습니다.",
  },
];

export const metadata: Metadata = buildPageMetadata({
  title: "강아지 Q&A",
  description:
    "강아지 산책, 사료 급여, 미용 주기 등 반려견 양육에 대한 자주 묻는 질문과 답변.",
  path: "/qna",
  keywords: ["강아지 Q&A", "반려견 질문", "강아지 미용", "강아지 산책"],
});

export default function QnaPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <JsonLd data={buildFaqPageJsonLd(SAMPLE_QNA)} />

      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        홈으로
      </Link>

      <h1 className="text-2xl font-bold">강아지 Q&A</h1>
      <p className="mt-2 text-muted">반려견에 대한 궁금증을 해결해 보세요.</p>

      <div className="mt-10 space-y-4">
        {SAMPLE_QNA.map((item) => (
          <details
            key={item.question}
            className="group rounded-2xl bg-white shadow-[var(--card-shadow)] open:shadow-[var(--card-shadow-hover)]"
          >
            <summary className="cursor-pointer list-none px-6 py-5 font-semibold text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
              {item.question}
            </summary>
            <div className="border-t border-gray-50 px-6 pb-5 pt-4 text-sm leading-relaxed text-muted">
              {item.answer}
            </div>
          </details>
        ))}
      </div>
    </main>
  );
}
