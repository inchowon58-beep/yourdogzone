import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { AdvisoryBannerHeadline } from "@/components/academy/AdvisoryBannerHeadline";
import { AdvisoryMemberCard } from "@/components/academy/AdvisoryMemberCard";
import {
  ADVISORY_BANNER_DESCRIPTION,
  ADVISORY_BANNER_EYEBROW,
} from "@/lib/site/advisory-banner";
import { getAllAdvisoryMembers } from "@/lib/site/advisory-members-store";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { ACADEMY_OG_SUBTITLE } from "@/lib/seo/og-image-render";

export const metadata: Metadata = buildPageMetadata({
  title: "공식 자문단 인증 위원장",
  description:
    "한국애견연맹 분야별 위원장단이 검증한 유아독존 공식 자문단 위원장 프로필과 자문 정보를 확인하세요.",
  path: "/services/academy/advisory",
  ogSubtitle: ACADEMY_OG_SUBTITLE,
  keywords: [
    "유아독존 공식 자문",
    "한국애견연맹 위원장",
    "애견미용학원 인증",
    "안심 인증 학원",
  ],
});

export const revalidate = 60;

export default async function AdvisoryMembersPage() {
  const members = await getAllAdvisoryMembers();

  return (
    <main className="w-full min-w-0 max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/services/academy"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        애견미용학원 목록
      </Link>

      <header className="mb-10 rounded-2xl border border-amber-100 bg-gradient-to-b from-white to-slate-50 p-6 shadow-sm sm:p-8">
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.15em] text-amber-700 uppercase">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          {ADVISORY_BANNER_EYEBROW}
        </p>
        <AdvisoryBannerHeadline as="h1" size="page" className="mt-3" />
        <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
          {ADVISORY_BANNER_DESCRIPTION}
        </p>
      </header>

      {members.length > 0 ? (
        <ul className="space-y-5">
          {members.map((member) => (
            <li key={member.id}>
              <AdvisoryMemberCard member={member} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-10 text-center text-sm text-muted">
          등록된 공식 자문단 위원 정보가 준비 중입니다.
        </p>
      )}
    </main>
  );
}
