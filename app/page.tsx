import { SearchBar } from "@/components/home/SearchBar";
import { HomeShortcuts } from "@/components/home/HomeShortcuts";
import { AgapetAdoptionSection } from "@/components/home/AgapetAdoptionSection";
import { CareMatchingSection } from "@/components/home/CareMatchingSection";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: "유아독존 | 반려견과 함께하는 모든 정보",
    description:
      "증상·질병 백과, 급여량 계산기, 사람 나이, 멍BTI, 먹어도 되나요부터 애견미용학원·분양·병원까지 — 반려 생활의 모든 것을 한곳에서.",
    path: "/",
    ogSubtitle: "반려견 생활 정보",
    keywords: [
      "유아독존",
      "반려견",
      "강아지",
      "반려동물 질병",
      "급여량 계산기",
      "멍BTI",
      "강아지 먹으면 안 되는 음식",
      "애견미용학원",
      "동물병원",
    ],
  }),
  title: {
    absolute: "유아독존 | 반려견과 함께하는 모든 정보",
  },
};

export default function Home() {
  return (
    <main className="flex w-full min-w-0 flex-1 flex-col">
      <section className="w-full min-w-0 px-1 pb-8 pt-10 sm:pb-10 sm:pt-14 md:pt-16">
        <h1 className="sr-only">유아독존 — 반려견과 함께하는 모든 정보</h1>

        <div className="flex flex-col items-center">
          <SearchBar />
          <div className="mt-9 w-full sm:mt-11">
            <HomeShortcuts />
          </div>
        </div>
      </section>

      <AgapetAdoptionSection />

      <CareMatchingSection />
    </main>
  );
}
