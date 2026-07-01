import {
  ADVISORY_BOARD_DESCRIPTION,
  ADVISORY_BOARD_HEADLINE,
  ADVISORY_BOARD_ITEMS,
} from "@/lib/site/advisory-board";

export function OfficialAdvisoryBoardSection() {
  return (
    <section
      className="mb-12 rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-6 shadow-sm sm:px-6 sm:py-7 md:px-8"
      aria-labelledby="advisory-board-heading"
    >
      <div className="mx-auto max-w-5xl text-center md:text-left">
        <p className="text-xs font-semibold tracking-wide text-primary">
          공식 자문단 인증
        </p>
        <h2
          id="advisory-board-heading"
          className="mt-2 text-base font-bold leading-snug text-slate-900 sm:text-lg"
        >
          {ADVISORY_BOARD_HEADLINE}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {ADVISORY_BOARD_DESCRIPTION}
        </p>
      </div>

      <ul className="mx-auto mt-6 grid max-w-5xl grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-4">
        {ADVISORY_BOARD_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.category}>
              <div className="flex h-full flex-col items-center rounded-xl border border-white/80 bg-white px-3 py-4 text-center shadow-[0_1px_2px_rgb(0_0_0/0.04)] sm:px-4 sm:py-5 md:items-start md:text-left">
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600"
                  aria-hidden
                >
                  <Icon className="h-5 w-5 stroke-[1.75]" />
                </span>
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-indigo-600/90">
                  [{item.category}]
                </p>
                <p className="mt-1 text-sm font-semibold leading-snug text-slate-800">
                  {item.title}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
