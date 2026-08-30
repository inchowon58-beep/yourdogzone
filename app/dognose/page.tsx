import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { BreedGrid } from "@/components/breed/BreedGrid";
import { BreedGroupTabs } from "@/components/breed/BreedGroupTabs";
import { BreedSearchBar } from "@/components/breed/BreedSearchBar";
import type { BreedGroupTab } from "@/lib/breeds/config";
import { getBreeds } from "@/lib/breeds/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildCategoryOgSubtitle } from "@/lib/seo/og-image-shared";

export const metadata: Metadata = buildPageMetadata({
  title: "견종소개",
  description:
    "말티즈, 포메라니안, 말티푸, 골든두들 등 인기 견종·믹스견의 유래, 성격, 털 관리, 건강 정보를 확인하세요.",
  path: "/dognose",
  ogSubtitle: buildCategoryOgSubtitle("견종소개"),
  keywords: [
    "견종소개",
    "견종 정보",
    "강아지 종류",
    "말티푸",
    "골든두들",
    "믹스견",
    "반려견 견종",
  ],
});

type PageProps = {
  searchParams: Promise<{ tab?: string; q?: string }>;
};

function parseTab(raw?: string): BreedGroupTab {
  const tabs = ["all", "toy", "small", "medium", "large", "giant", "designer"] as const;
  if (raw && tabs.includes(raw as BreedGroupTab)) return raw as BreedGroupTab;
  return "all";
}

export default async function DognosePage({ searchParams }: PageProps) {
  const { tab: rawTab, q } = await searchParams;
  const tab = parseTab(rawTab);
  const breeds = await getBreeds({ tab, query: q });

  return (
    <main className="w-full min-w-0 px-4 py-8 sm:px-6 sm:py-10 md:py-14">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        홈으로
      </Link>

      <section className="mb-10 text-center md:mb-14">
        <p className="mb-3 text-sm font-semibold text-primary">견종 딕셔너리</p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
          견종소개
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-base text-muted">
          순종부터 말티푸·카바푸·골든두들 같은 디자이너 믹스견까지, 견종별 유래·성격·
          관리법을 한곳에서 확인하세요.
        </p>
        <div className="mt-8 flex w-full min-w-0 justify-center">
          <Suspense fallback={null}>
            <BreedSearchBar defaultQuery={q} />
          </Suspense>
        </div>
      </section>

      <section className="mb-8">
        <Suspense fallback={null}>
          <BreedGroupTabs activeTab={tab} />
        </Suspense>
      </section>

      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-sm text-muted">
          총 <span className="font-semibold text-foreground">{breeds.length}</span>개 견종
          {q ? ` · "${q}" 검색` : ""}
        </p>
        <Link
          href="/dognose/register"
          className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-muted hover:border-primary/30 hover:text-primary"
        >
          <Plus className="h-3.5 w-3.5" />
          견종 등록
        </Link>
      </div>

      <BreedGrid breeds={breeds} />
    </main>
  );
}
