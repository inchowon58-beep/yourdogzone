import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Dog, Ruler, Scale, Timer } from "lucide-react";
import { ImageSlider } from "@/components/academy/ImageSlider";
import {
  BREED_KIND_LABELS,
  breedDetailPath,
} from "@/lib/breeds/config";
import { getBreedBySlug, getBreedSlugs } from "@/lib/breeds/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildCategoryOgSubtitle } from "@/lib/seo/og-image-shared";

export const revalidate = 3600;
export const dynamicParams = true;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await getBreedSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const breed = await getBreedBySlug(slug);
  if (!breed) return { title: "찾을 수 없습니다" };
  return buildPageMetadata({
    title: `${breed.name_ko} (${breed.name_en})`,
    description: breed.summary,
    path: breedDetailPath(breed.slug),
    keywords: [breed.name_ko, breed.name_en, "견종소개", ...breed.tags],
    ogSubtitle: buildCategoryOgSubtitle("견종소개"),
    imageAlt: `${breed.name_ko} 견종 사진`,
  });
}

const SECTIONS: { key: keyof ReturnType<typeof sectionMap>; title: string }[] = [
  { key: "history", title: "유래·역사" },
  { key: "personality", title: "성격" },
  { key: "appearance", title: "외모·특징" },
  { key: "grooming", title: "털 관리·미용" },
  { key: "exercise", title: "운동량" },
  { key: "health", title: "건강·질병" },
  { key: "training", title: "훈련" },
  { key: "living", title: "사육 환경" },
];

function sectionMap(breed: NonNullable<Awaited<ReturnType<typeof getBreedBySlug>>>) {
  return {
    history: breed.history,
    personality: breed.personality,
    appearance: breed.appearance,
    grooming: breed.grooming,
    exercise: breed.exercise,
    health: breed.health,
    training: breed.training,
    living: breed.living,
  };
}

export default async function BreedDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const breed = await getBreedBySlug(slug);
  if (!breed) notFound();

  const images = [
    ...(breed.hero_image ? [breed.hero_image] : []),
    ...(breed.gallery_images ?? []),
  ];
  const sections = sectionMap(breed);

  return (
    <main className="w-full min-w-0 px-4 py-8 sm:px-6 sm:py-10 pb-14">
      <Link
        href="/dognose"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        견종 목록
      </Link>

      <article>
        <header className="mb-8">
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {breed.size_label}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-muted">
              {BREED_KIND_LABELS[breed.kind]}
            </span>
            {breed.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            {breed.name_ko}
          </h1>
          <p className="mt-1 text-lg text-muted">{breed.name_en}</p>
          <p className="mt-4 text-base leading-relaxed text-muted">{breed.summary}</p>
        </header>

        {images.length > 0 ? (
          <section className="mb-10" aria-label={`${breed.name_ko} 사진`}>
            <ImageSlider images={images} alt={breed.name_ko} />
          </section>
        ) : (
          <div className="mb-10 flex aspect-[2/1] items-center justify-center rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100">
            <Dog className="h-16 w-16 text-gray-300" />
          </div>
        )}

        <section className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={<Timer className="h-4 w-4" />} label="수명" value={breed.lifespan} />
          <StatCard icon={<Scale className="h-4 w-4" />} label="체중" value={breed.weight} />
          <StatCard icon={<Ruler className="h-4 w-4" />} label="체고" value={breed.height} />
          <StatCard icon={<Dog className="h-4 w-4" />} label="원산지" value={breed.origin} />
        </section>

        {SECTIONS.map(({ key, title }) => {
          const value = sections[key];
          if (!value?.trim()) return null;
          return (
            <section key={key} className="mb-8">
              <h2 className="mb-3 text-lg font-semibold">{title}</h2>
              <div className="rounded-2xl bg-white p-5 shadow-[var(--card-shadow)]">
                <p className="whitespace-pre-line leading-relaxed text-muted">{value}</p>
              </div>
            </section>
          );
        })}
      </article>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  if (!value?.trim()) return null;
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-[var(--card-shadow)]">
      <div className="mb-2 flex items-center gap-1.5 text-xs text-muted">
        {icon}
        {label}
      </div>
      <p className="text-sm font-semibold leading-snug">{value}</p>
    </div>
  );
}
