import type { RegionalSeoBlock } from "@/lib/academy/regional-landing";

type Props = {
  label: string;
  blocks: RegionalSeoBlock[];
};

export function RegionalAcademySeoSection({ label, blocks }: Props) {
  return (
    <section
      className="mb-12 rounded-2xl border border-gray-100 bg-white p-6 shadow-[var(--card-shadow)] sm:p-8"
      aria-labelledby="regional-seo-heading"
    >
      <p className="mb-2 text-sm font-semibold text-primary">
        {label} 애견미용학원 가이드
      </p>
      <h2
        id="regional-seo-heading"
        className="text-xl font-bold tracking-tight text-foreground sm:text-2xl"
      >
        {label} 지역 애견미용학원 정보
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        {label}에서 애견미용학원을 찾고 계신가요? 수강료·자격증·실습 환경을
        비교할 때 참고할 수 있는 {label} 애견미용학원 안내입니다.
      </p>

      <div className="mt-8 space-y-8">
        {blocks.map((block) => (
          <article key={block.title}>
            <h3 className="text-base font-bold text-foreground sm:text-lg">
              {block.title}
            </h3>
            <div className="mt-3 space-y-3">
              {block.paragraphs.map((p) => (
                <p
                  key={p.slice(0, 40)}
                  className="text-sm leading-relaxed text-muted"
                >
                  {p}
                </p>
              ))}
            </div>
            <ul className="mt-4 space-y-2 rounded-xl border border-gray-100 bg-gray-50/60 p-4">
              {block.bullets.map((item) => (
                <li
                  key={item}
                  className="flex gap-2 text-sm leading-relaxed text-muted"
                >
                  <span
                    className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary"
                    aria-hidden
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
