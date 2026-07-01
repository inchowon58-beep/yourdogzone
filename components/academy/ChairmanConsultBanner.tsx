import Link from "next/link";
import { BadgeCheck, MessageCircle, Quote } from "lucide-react";
import { ProfilePhoto } from "@/components/academy/ProfilePhoto";
import { buildChairmanQuote } from "@/lib/site/chairman-consult";
import { resolveChairmanConsultConfig } from "@/lib/site/chairman-consult-resolve";

type Props = {
  /** 지역명 (선택) — 맥락 문구에 사용 */
  regionLabel?: string;
};

export async function ChairmanConsultBanner({ regionLabel }: Props) {
  const config = await resolveChairmanConsultConfig();
  const quote = buildChairmanQuote(regionLabel);

  return (
    <section
      className="mb-5 overflow-hidden rounded-2xl border border-indigo-100/80 bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 p-4 shadow-sm sm:p-6 md:p-8"
      aria-labelledby="chairman-consult-heading"
    >
      <div className="grid grid-cols-2 items-start gap-x-3 gap-y-4 md:grid-cols-[10rem_minmax(0,1fr)] md:gap-x-8">
        <div className="col-start-1 row-start-1 min-w-0 justify-self-start">
          <div className="relative aspect-square w-full max-w-[9.5rem] overflow-hidden rounded-2xl border-2 border-white bg-slate-100 shadow-md md:h-40 md:w-40 md:max-w-none">
            <ProfilePhoto src={config.profileImage} alt={config.profileAlt} />
          </div>
          <p className="mt-2 hidden items-center gap-1.5 rounded-full bg-indigo-600/10 px-3 py-1 text-xs font-semibold text-indigo-700 md:inline-flex">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
            공식 인증 자문
          </p>
        </div>

        <div className="col-start-2 row-start-1 min-w-0 self-center text-left md:self-start">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600 md:text-xs">
            1:1 맞춤 학원 매칭
            {regionLabel ? ` · ${regionLabel}` : ""}
          </p>
          <h3
            id="chairman-consult-heading"
            className="mt-1.5 text-sm font-bold leading-snug text-slate-900 md:mt-2 md:text-xl"
          >
            {config.fullTitle}
          </h3>
          <p className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-indigo-600/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 md:hidden">
            <BadgeCheck className="h-3 w-3 shrink-0" aria-hidden />
            공식 인증 자문
          </p>

          <blockquote className="relative mt-4 hidden rounded-xl border border-indigo-100 bg-white/80 px-4 py-3.5 text-left shadow-sm md:block">
            <Quote
              className="absolute -left-1 -top-2 h-6 w-6 text-indigo-200"
              aria-hidden
            />
            <p className="text-sm leading-relaxed text-slate-600 sm:text-[0.95rem]">
              {quote}
            </p>
          </blockquote>

          {config.isEnabled ? (
            <Link
              href={config.kakaoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 hidden items-center justify-center gap-2 self-start rounded-xl bg-[#FEE500] px-5 py-3.5 text-sm font-bold text-[#3C1E1E] shadow-sm transition hover:brightness-95 active:scale-[0.98] md:inline-flex"
            >
              <MessageCircle className="h-5 w-5 shrink-0" />
              {config.ctaLabel}
            </Link>
          ) : (
            <p className="mt-5 hidden rounded-xl border border-dashed border-gray-200 bg-white/60 px-4 py-3 text-left text-sm text-muted md:block">
              카카오톡 1:1 상담 채널 연결 준비 중입니다.
            </p>
          )}
        </div>

        <blockquote className="relative col-span-2 rounded-xl border border-indigo-100 bg-white/80 px-3 py-3 text-left shadow-sm md:hidden">
          <Quote
            className="absolute -left-1 -top-2 h-5 w-5 text-indigo-200"
            aria-hidden
          />
          <p className="text-xs leading-relaxed text-slate-600">{quote}</p>
        </blockquote>

        {config.isEnabled ? (
          <Link
            href={config.kakaoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="col-span-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] px-4 py-3 text-sm font-bold text-[#3C1E1E] shadow-sm transition hover:brightness-95 active:scale-[0.98] md:hidden"
          >
            <MessageCircle className="h-5 w-5 shrink-0" />
            {config.ctaLabel}
          </Link>
        ) : (
          <p className="col-span-2 rounded-xl border border-dashed border-gray-200 bg-white/60 px-4 py-3 text-center text-sm text-muted md:hidden">
            카카오톡 1:1 상담 채널 연결 준비 중입니다.
          </p>
        )}
      </div>
    </section>
  );
}
