import type { DreamLongform } from "@/lib/dreams/longform-types";
import { dreamLongformCharCount } from "@/lib/dreams/longform-types";

const OMEN_STYLE: Record<
  DreamLongform["omen"],
  { bg: string; text: string; ring: string }
> = {
  길몽: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    ring: "ring-emerald-200",
  },
  흉몽: { bg: "bg-red-50", text: "text-red-800", ring: "ring-red-200" },
  심리몽: {
    bg: "bg-indigo-50",
    text: "text-indigo-800",
    ring: "ring-indigo-200",
  },
  길흉혼재: {
    bg: "bg-amber-50",
    text: "text-amber-900",
    ring: "ring-amber-200",
  },
};

function Paras({ text }: { text: string }) {
  return (
    <div className="space-y-4">
      {text
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p, i) => (
          <p
            key={`${i}-${p.length}`}
            className="text-[15px] leading-8 text-[#3d3a4f] sm:text-base sm:leading-8"
          >
            {p}
          </p>
        ))}
    </div>
  );
}

export function DreamLongformView({
  longform,
  showHeadline = true,
}: {
  longform: DreamLongform;
  showHeadline?: boolean;
}) {
  const omen = OMEN_STYLE[longform.omen];
  const chars = dreamLongformCharCount(longform);

  return (
    <div className="space-y-6">
      {showHeadline ? (
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#3d3a4f] via-[#4a4458] to-[#6b5a5a] p-6 text-white shadow-[var(--card-shadow-hover)] sm:p-8">
          <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
            {longform.omen}
            {longform.source === "gemini" ? " · AI 전문 해몽" : ""}
          </span>
          <h2 className="mt-4 text-xl font-black leading-snug sm:text-2xl sm:leading-snug">
            {longform.headline}
          </h2>
        </div>
      ) : null}

      <div
        className={`rounded-2xl ${omen.bg} p-5 ring-1 ${omen.ring} sm:p-6`}
      >
        <p className={`text-xs font-black tracking-wide ${omen.text}`}>
          핵심 요약 · {longform.omen}
        </p>
        <div className="mt-3">
          <Paras text={longform.summaryBox} />
        </div>
      </div>

      <section className="rounded-2xl border border-[#e8ddd4] bg-white p-5 shadow-[var(--card-shadow)] sm:p-7">
        <h3 className="text-lg font-black text-[#2c2a3a]">
          꿈의 상징적 의미 · 종합 해몽
        </h3>
        <div className="mt-4">
          <Paras text={longform.symbolism} />
        </div>
      </section>

      {longform.quote ? (
        <blockquote className="rounded-2xl border-l-4 border-[#b88a8a] bg-[#fbf7f3] px-5 py-4 text-[15px] font-semibold leading-7 text-[#5c3030] sm:text-base">
          “{longform.quote}”
        </blockquote>
      ) : null}

      <section className="space-y-3">
        <h3 className="px-1 text-lg font-black text-[#2c2a3a]">
          상황별 세부 해석
        </h3>
        {longform.details.map((d) => (
          <div
            key={d.title}
            className="rounded-2xl border border-[#e8ddd4] bg-[#fbf7f3] p-5 sm:p-6"
          >
            <h4 className="text-sm font-black text-[#5c3030] sm:text-base">
              {d.title}
            </h4>
            <div className="mt-3">
              <Paras text={d.body} />
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-[#e8ddd4] bg-white p-5 shadow-[var(--card-shadow)] sm:p-7">
        <h3 className="text-lg font-black text-[#2c2a3a]">
          보호자의 무의식적 심리
        </h3>
        <div className="mt-4">
          <Paras text={longform.psychology} />
        </div>
      </section>

      <section className="rounded-2xl bg-gradient-to-br from-[#3d3a4f] to-[#6b5a5a] p-5 text-white sm:p-7">
        <h3 className="text-lg font-black">오늘 실천할 펫 케어 팁</h3>
        <div className="mt-4 space-y-4 text-[15px] leading-8 text-white/90 sm:text-base">
          {longform.careTip
            .split(/\n{2,}/)
            .map((p) => p.trim())
            .filter(Boolean)
            .map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
        </div>
        <p className="mt-5 text-[11px] text-white/50">약 {chars}자 해몽</p>
      </section>
    </div>
  );
}
