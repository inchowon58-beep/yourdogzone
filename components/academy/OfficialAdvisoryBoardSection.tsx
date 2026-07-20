import { GoldCertificationBadge } from "@/components/academy/GoldCertificationBadge";
import {
  ADVISORY_BOARD_DESCRIPTION,
  ADVISORY_BOARD_EYEBROW,
  ADVISORY_BOARD_HEADLINE,
  ADVISORY_BOARD_ITEMS,
} from "@/lib/site/advisory-board";

export function OfficialAdvisoryBoardSection() {
  return (
    <section
      className="relative mb-12 overflow-hidden rounded-2xl border border-amber-100 bg-gradient-to-b from-white to-slate-50 px-5 py-10 shadow-md sm:px-8 sm:py-12 md:px-10 md:py-14"
      aria-labelledby="advisory-board-heading"
    >
      <div
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/80 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-100 to-transparent"
        aria-hidden
      />

      <div className="relative mx-auto w-full">
        <p className="text-center text-xs font-semibold tracking-[0.18em] text-[#b8860b] uppercase md:text-left">
          {ADVISORY_BOARD_EYEBROW}
        </p>
        <h2
          id="advisory-board-heading"
          className="certificate-serif mt-4 text-center text-xl font-bold leading-snug text-[#1e3a8a] sm:text-2xl md:text-left md:text-[1.65rem] md:leading-tight"
        >
          {ADVISORY_BOARD_HEADLINE}
        </h2>
        <p className="mt-4 text-center text-sm leading-relaxed text-slate-600 sm:text-[0.95rem] md:max-w-4xl md:text-left md:text-base">
          {ADVISORY_BOARD_DESCRIPTION}
        </p>

        <ul className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-4">
          {ADVISORY_BOARD_ITEMS.map((item) => (
            <li key={item.category}>
              <article className="group grid h-full grid-cols-2 items-start gap-3 rounded-xl border border-amber-100/90 bg-white px-3 py-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md sm:px-4 sm:py-5 md:flex md:flex-col md:items-stretch md:gap-0 md:px-5 md:py-6">
                <div className="flex min-w-0 items-start justify-start md:w-full md:justify-center">
                  <GoldCertificationBadge className="h-[4.5rem] w-[4.5rem] shrink-0 transition-transform duration-300 group-hover:scale-105 sm:h-20 sm:w-20 md:mx-auto md:mt-1" />
                </div>
                <div className="flex min-w-0 flex-col justify-center text-left md:w-full md:mt-5 md:text-center">
                  <p className="text-[10px] font-semibold tracking-wide text-amber-700/90 sm:text-[11px]">
                    [{item.category}]
                  </p>
                  <h3 className="certificate-serif mt-1.5 text-xs font-bold leading-snug text-[#1e3a8a] sm:text-sm md:mt-2 md:text-[0.95rem]">
                    {item.title}
                  </h3>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
