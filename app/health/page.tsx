import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { HealthEncyclopedia } from "@/components/health/HealthEncyclopedia";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { HEALTH_GUIDES } from "@/lib/health";

export const metadata: Metadata = buildPageMetadata({
  title: "반려동물 증상·질병·예방 백과",
  description:
    "강아지·고양이·파충류·새·소동물·관상어의 증상·질병·예방 가이드. 신호, 의심 원인, 가정 관리, 병원 가야 할 때까지 정리했습니다.",
  path: "/health",
  ogSubtitle: "증상·질병 백과",
  keywords: [
    "반려동물 질병",
    "강아지 증상",
    "고양이 질병",
    "슬개골 탈구",
    "만성신부전",
    "예방접종",
  ],
});

export default function HealthPage() {
  return (
    <main className="w-full min-w-0 max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        홈으로
      </Link>

      <p className="text-xs font-bold tracking-wide text-primary">
        유아독존 HEALTH
      </p>
      <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
        증상·질병 백과
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
        우리 아이에게 흔한 증상과 질환을, 신호부터 집에서 할 일·병원 신호·예방까지
        한 흐름으로 정리했어요. 현재{" "}
        <strong className="text-foreground">{HEALTH_GUIDES.length}개</strong> 가이드가
        등록되어 있습니다.
      </p>

      <div className="mt-8">
        <HealthEncyclopedia />
      </div>
    </main>
  );
}
