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
      className="group relative mb-5 block overflow-hidden rounded-2xl border border-slate-700/50 bg-[#0f172a] p-5 shadow-md transition-all duration-300 hover:border-amber-400/40 hover:shadow-lg sm:p-6 md:p-8"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgb(251_191_36/0.06),_transparent_55%)]" />
      <div className="relative">
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.15em] text-amber-400/90 uppercase">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          {ADVISORY_BANNER_EYEBROW}
        </p>
        <h2 className="mt-3 text-lg font-extrabold leading-snug text-red-400 sm:text-xl">
          {ADVISORY_BANNER_HEADLINE}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-[0.95rem]">
          {ADVISORY_BANNER_DESCRIPTION}
        </p>
        <p className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-amber-400 transition group-hover:gap-2">
          공식 자문단 위원장 전체 보기
          <ChevronRight className="h-4 w-4" aria-hidden />
        </p>
      </div>
    </Link>
  );
}
