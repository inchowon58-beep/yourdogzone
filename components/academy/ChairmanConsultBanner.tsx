import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, MessageCircle, Quote } from "lucide-react";
import {
  buildChairmanQuote,
  getChairmanConsultConfig,
} from "@/lib/site/chairman-consult";

type Props = {
  /** 지역명 (선택) — 맥락 문구에 사용 */
  regionLabel?: string;
};

export function ChairmanConsultBanner({ regionLabel }: Props) {
  const config = getChairmanConsultConfig();
  const quote = buildChairmanQuote(regionLabel);

  return (
    <section
      className="mb-12 overflow-hidden rounded-2xl border border-indigo-100/80 bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 p-5 shadow-sm sm:p-6 md:p-8"
      aria-labelledby="chairman-consult-heading"
    >
      <div className="flex flex-col items-center gap-6 md:flex-row md:items-stretch md:gap-8">
        <div className="flex shrink-0 flex-col items-center md:items-start">
          <div className="relative">
            <div
              className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-indigo-200/60 to-indigo-500/20 blur-sm"
              aria-hidden
            />
            <div className="relative h-36 w-36 overflow-hidden rounded-2xl border-2 border-white bg-white shadow-md sm:h-40 sm:w-40">
              <Image
                src={config.profileImage}
                alt={config.profileAlt}
                fill
                className="object-cover object-[center_15%]"
                sizes="(max-width: 768px) 144px, 160px"
                priority={false}
              />
            </div>
          </div>
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-indigo-600/10 px-3 py-1 text-xs font-semibold text-indigo-700">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
            공식 인증 자문
          </p>
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center text-center md:text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            1:1 맞춤 학원 매칭
            {regionLabel ? ` · ${regionLabel}` : ""}
          </p>
          <h3
            id="chairman-consult-heading"
            className="mt-2 text-lg font-bold leading-snug text-slate-900 sm:text-xl"
          >
            {config.fullTitle}
          </h3>

          <blockquote className="relative mt-4 rounded-xl border border-indigo-100 bg-white/80 px-4 py-3.5 text-left shadow-sm">
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
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] px-5 py-3.5 text-sm font-bold text-[#3C1E1E] shadow-sm transition hover:brightness-95 active:scale-[0.98] md:w-auto md:self-start"
            >
              <MessageCircle className="h-5 w-5 shrink-0" />
              {config.ctaLabel}
            </Link>
          ) : (
            <p className="mt-5 rounded-xl border border-dashed border-gray-200 bg-white/60 px-4 py-3 text-center text-sm text-muted md:text-left">
              카카오톡 1:1 상담 채널 연결 준비 중입니다.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
