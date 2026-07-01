import Link from "next/link";
import { ChevronRight, ShieldCheck } from "lucide-react";
import {
  ADVISORY_BANNER_DESCRIPTION,
  ADVISORY_BANNER_EYEBROW,
  ADVISORY_BANNER_HEADLINE,
  ADVISORY_PAGE_PATH,
} from "@/lib/site/advisory-banner";

export function OfficialAdvisoryBanner() {
  return (
    <Link
      href={ADVISORY_PAGE_PATH}
      className="group mb-5 block overflow-hidden rounded-2xl border border-amber-100 bg-gradient-to-b from-white to-slate-50 p-5 shadow-sm transition-all duration-300 hover:border-primary/25 hover:shadow-md sm:p-6 md:p-8"
    >
      <p className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-primary">
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
        {ADVISORY_BANNER_EYEBROW}
      </p>
      <h2 className="certificate-serif mt-3 text-base font-bold leading-snug text-[#1e3a8a] sm:text-lg">
        {ADVISORY_BANNER_HEADLINE}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-[0.95rem]">
        {ADVISORY_BANNER_DESCRIPTION}
      </p>
      <p className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary transition group-hover:gap-2">
        공식 자문단 위원장 전체 보기
        <ChevronRight className="h-4 w-4" aria-hidden />
      </p>
    </Link>
  );
}
