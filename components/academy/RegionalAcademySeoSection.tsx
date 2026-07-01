import type { RegionalSeoBlock } from "@/lib/academy/regional-seo-content";

type Props = {
  label: string;
  blocks: RegionalSeoBlock[];
  recommendedAcademyName?: string;
  nearbyAcademyName?: string;
  nearbyRegion?: string;
};

export function RegionalAcademySeoSection({
  label,
  blocks,
  recommendedAcademyName,
  nearbyAcademyName,
  nearbyRegion,
}: Props) {
  const intro = recommendedAcademyName
    ? `${label} 지역 인증 추천 학원 [${recommendedAcademyName}]을 포함해, 예비 수강생·학원 원장님·검색 사용자 모두를 위한 정보입니다.`
    : nearbyAcademyName
      ? `${label}에는 아직 인증 추천 학원이 없습니다. 인근 ${nearbyRegion ?? "지역"} [{nearbyAcademyName}]도 참고하면 좋을 것 같습니다.`
      : `${label}에서 애견미용학원을 찾고 계신가요? 수강료·자격증·실습 환경 비교 가이드입니다.`;

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
        {label} 애견미용학원 — 수강 전 꼭 알아둘 정보
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">{intro}</p>

      <div className="mt-8 space-y-10">
        {blocks.map((block, index) => {
          const Heading = index === 0 ? "h2" : "h3";
          return (
            <article key={`${block.title}-${index}`}>
              <Heading
                className={
                  index === 0
                    ? "text-lg font-bold text-foreground sm:text-xl"
                    : "text-base font-bold text-foreground sm:text-lg"
                }
              >
                {block.title}
              </Heading>
              <div className="mt-3 space-y-3">
                {block.paragraphs.map((p) => (
                  <p
                    key={p.slice(0, 48)}
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
                    <span className="shrink-0 text-primary" aria-hidden>
                      •
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
}
