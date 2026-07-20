import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { CareIntakeApplyButton } from "@/components/care-matching/CareIntakeApplyButton";

export const metadata: Metadata = buildPageMetadata({
  title: "안심 돌봄 매칭 서비스",
  description:
    "불가피한 이별의 순간, 책임 접수와 보호 분담금 매칭·가족 매칭 케어로 아이의 안전을 지키는 유아독존 안심 돌봄 매칭.",
  path: "/care-matching",
  ogSubtitle: "안심 돌봄 매칭",
  keywords: [
    "안심 돌봄 매칭",
    "보호 분담금",
    "책임 접수비",
    "가족 매칭 케어",
    "사설보호소",
  ],
});

export default function CareMatchingPage() {
  return (
    <main className="w-full min-w-0 px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        홈으로
      </Link>

      <p className="text-xs font-bold tracking-[0.12em] text-primary">
        입소비 격차, 직접 확인하세요
      </p>
      <h1 className="mt-2 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
        2,000만 원짜리 견적과
        <br />
        20만 원대 제안, 왜 다를까요?
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-muted sm:text-[15px]">
        경매·입찰이 아닙니다. 검증된 보호소가 평생 돌봄에 필요한 현실적 분담금을
        제안하고, 보호자가 한눈에 비교해 스스로 고를 수 있게 만듭니다.
      </p>

      <div className="mt-10 space-y-6">
        <article className="rounded-2xl bg-white p-6 shadow-[var(--card-shadow)]">
          <h2 className="text-base font-bold text-foreground">책임 접수비</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            5만 원의 책임 접수비는 무분별한 파양 신청을 막는 최소 책임 비용이자,
            허위 매물·노쇼 방지용 보증금 성격입니다. 시스템 유지와 진정성 있는
            신청을 위한 장치입니다.
          </p>
        </article>

        <article className="rounded-2xl bg-white p-6 shadow-[var(--card-shadow)]">
          <h2 className="text-base font-bold text-foreground">
            안심 돌봄 견적 제안 · 보호 분담금 매칭
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            보호소가 아이를 데려가기 위해 가격을 깎는 구조가 아닙니다. 시설
            수준과 상황에 맞춰 “평생 돌봄을 위한 현실적 분담금”을 제안하는 안심
            돌봄 견적입니다.
          </p>
        </article>

        <article className="rounded-2xl bg-white p-6 shadow-[var(--card-shadow)]">
          <h2 className="text-base font-bold text-foreground">
            가족 매칭 케어 (안심 직거래)
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            분담금이 부담될 경우, 보호소가 아닌 유아독존 인증 보호자에게
            다이렉트로 안전하게 연결하는 완충 지대입니다. 돈이 목적이 아니라
            아이의 안전이 목적임을 분명히 합니다.
          </p>
        </article>
      </div>

      <div
        id="apply"
        className="mt-12 scroll-mt-24 rounded-2xl border border-primary/15 bg-primary/5 p-6 sm:p-8"
      >
        <h2 className="text-lg font-bold text-foreground">
          우리아이 안심입소 신청
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          정보를 등록한 뒤 책임 접수비 입금이 확인되면, 전국 사설보호소에
          정보가 전달되고 입소 가능한 안심 돌봄 분담금 제안이 시작됩니다.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <CareIntakeApplyButton className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover" />
          <Link
            href="/services/shelter"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-300 bg-white px-5 text-sm font-semibold text-foreground hover:border-primary/40 hover:text-primary"
          >
            보호소 정보 살펴보기
          </Link>
        </div>
      </div>
    </main>
  );
}
