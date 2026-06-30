import { SearchBar } from "@/components/home/SearchBar";
import { ServiceGrid } from "@/components/home/ServiceGrid";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: "유아독존 | 반려견과 함께하는 모든 정보",
    description:
      "애견미용학원, 강아지분양, 보호소, 장례식장, 브리더, 견종소개, 동물병원, Q&A까지 — 반려견 생활의 모든 것을 한곳에서.",
    path: "/",
    keywords: [
      "유아독존",
      "반려견",
      "강아지",
      "애견미용학원",
      "강아지분양",
      "동물병원",
      "견종소개",
    ],
  }),
  title: {
    absolute: "유아독존 | 반려견과 함께하는 모든 정보",
  },
};

export default function Home() {
  return (
    <main className="flex-1">
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pt-16 md:pt-24">
        <div className="mb-16 flex flex-col items-center text-center">
          <p className="mb-4 text-sm font-semibold tracking-wide text-primary">
            반려동물 통합 포털
          </p>
          <h1 className="max-w-xl text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl md:text-4xl">
            유아독존
            <br />
            반려견과 함께하는 모든 정보
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-muted">
            미용학원부터 분양, 보호소, 병원까지 — 필요한 서비스를 빠르게
            찾아보세요.
          </p>
          <div className="mt-10 w-full flex justify-center">
            <SearchBar />
          </div>
        </div>

        <ServiceGrid />
      </section>
    </main>
  );
}
