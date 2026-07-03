import type { RegionalSeoBlock } from "@/lib/academy/regional-seo-content";
import { AcademyThumbnail } from "@/components/academy/AcademyThumbnail";
import Link from "next/link";

type FeaturedAcademy = {
  name: string;
  slug: string;
  images: string[];
  regionLabel?: string;
  isNearby?: boolean;
};

type Props = {
  label: string;
  blocks: RegionalSeoBlock[];
  intro: string;
  featuredAcademy?: FeaturedAcademy | null;
  serviceTitle?: string;
  servicePath?: string;
  entityLabel?: string;
  guideSectionTitle?: string;
};

export function RegionalAcademySeoSection({
  label,
  blocks,
  intro,
  featuredAcademy,
  serviceTitle = "애견미용학원",
  servicePath = "/services/academy",
  entityLabel = "학원",
  guideSectionTitle = "수강 전 꼭 알아둘 정보",
}: Props) {
  return (
    <section
      className="mb-12 rounded-2xl border border-gray-100 bg-white p-6 shadow-[var(--card-shadow)] sm:p-8"
      aria-labelledby="regional-seo-heading"
    >
      <p className="mb-2 text-sm font-semibold text-primary">
        {label} {serviceTitle} 가이드
      </p>
      <h2
        id="regional-seo-heading"
        className="text-xl font-bold tracking-tight text-foreground sm:text-2xl"
      >
        {label} {serviceTitle} — {guideSectionTitle}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">{intro}</p>

      {featuredAcademy && featuredAcademy.images.length > 0 && (
        <div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 sm:p-5">
          <p className="text-sm font-semibold text-foreground">
            {featuredAcademy.isNearby
              ? `인근 ${featuredAcademy.regionLabel ?? "지역"} 인증 추천 ${entityLabel}`
              : `${label} 인증 추천 ${entityLabel}`}
            {" · "}
            <Link
              href={`${servicePath}/${featuredAcademy.slug}`}
              className="text-primary hover:underline"
            >
              {featuredAcademy.name}
            </Link>
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {featuredAcademy.images.map((url, index) => (
              <AcademyThumbnail
                key={url}
                src={url}
                alt={`${featuredAcademy.name} 사진 ${index + 1}`}
                className={`aspect-[4/3] rounded-lg${index >= 2 ? " hidden sm:block" : ""}`}
              />
            ))}
          </div>
        </div>
      )}

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
