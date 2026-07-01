import {
  ADVISORY_BOARD_DESCRIPTION,
  ADVISORY_BOARD_EYEBROW,
  ADVISORY_BOARD_HEADLINE,
  ADVISORY_BOARD_ITEMS,
} from "@/lib/site/advisory-board";

export function OfficialAdvisoryBoardSection() {
  return (
    <section
      className="relative mb-12 overflow-hidden rounded-2xl border border-slate-700/60 bg-[#0f172a] px-5 py-10 shadow-[0_20px_50px_-12px_rgb(0_0_0/0.45)] sm:px-8 sm:py-12 md:px-10 md:py-16"
      aria-labelledby="advisory-board-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgb(251_191_36/0.08),_transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl">
        <p className="text-center text-xs font-semibold tracking-[0.2em] text-amber-400/90 uppercase md:text-left">
          {ADVISORY_BOARD_EYEBROW}
        </p>
        <h2
          id="advisory-board-heading"
          className="mt-4 text-center text-xl font-extrabold leading-snug text-red-400 sm:text-2xl md:text-left md:text-[1.65rem] md:leading-tight"
        >
          {ADVISORY_BOARD_HEADLINE}
        </h2>
        <p className="mt-5 text-center text-sm leading-relaxed text-slate-300 sm:text-[0.95rem] md:max-w-4xl md:text-left md:text-base">
          {ADVISORY_BOARD_DESCRIPTION}
        </p>

        <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-4">
          {ADVISORY_BOARD_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.category}>
                <article className="group flex h-full flex-col rounded-xl border border-slate-600/50 bg-[#1e293b] px-4 py-5 transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/50 hover:shadow-[0_12px_32px_-8px_rgb(251_191_36/0.25)] sm:px-5 sm:py-6">
                  <span
                    className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-amber-400/20 bg-amber-400/10 text-amber-400 transition-colors duration-300 group-hover:border-amber-400/40 group-hover:bg-amber-400/15"
                    aria-hidden
                  >
                    <Icon className="h-5 w-5 stroke-[1.75]" />
                  </span>
                  <p className="mt-4 text-[11px] font-medium tracking-wide text-slate-400">
                    [{item.category}]
                  </p>
                  <h3 className="mt-2 text-sm font-bold leading-snug text-amber-400 sm:text-[0.95rem]">
                    {item.title}
                  </h3>
                </article>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
