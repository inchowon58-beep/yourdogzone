import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import {
  FOOD_LEVEL_HINT,
  FOOD_LEVEL_LABEL,
  FOOD_LEVEL_TONE,
  PET_FOODS,
  getFoodBySlug,
  levelFor,
} from "@/lib/tools/foods";
import type { PetSpecies } from "@/lib/tools/feeding";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { Pill } from "@/components/tools/ToolUi";
import { SafeFoodImage } from "@/components/tools/SafeFoodImage";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ species?: string }>;
};

export function generateStaticParams() {
  return PET_FOODS.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const food = getFoodBySlug(slug);
  if (!food) return {};
  return buildPageMetadata({
    title: `강아지·고양이 ${food.name} 먹어도 되나요?`,
    description: food.oneLiner,
    path: `/tools/food/${food.slug}`,
    ogSubtitle: "먹어도 되나요",
    keywords: [`${food.name} 강아지`, `${food.name} 고양이`, ...food.keywords],
  });
}

export default async function FoodDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const food = getFoodBySlug(slug);
  if (!food) notFound();

  const species: PetSpecies = sp.species === "cat" ? "cat" : "dog";
  const level = levelFor(food, species);
  const tone = FOOD_LEVEL_TONE[level];
  const other: PetSpecies = species === "dog" ? "cat" : "dog";
  const otherLevel = levelFor(food, other);
  const related = PET_FOODS.filter((f) => f.slug !== food.slug).slice(0, 8);

  return (
    <main className="w-full min-w-0 px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/tools/food"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        먹이정보 목록
      </Link>

      <div className="overflow-hidden rounded-2xl shadow-[var(--card-shadow)]">
        <div className="relative h-52 sm:h-64">
          <SafeFoodImage
            src={food.image}
            alt={food.imageAlt}
            emoji={food.emoji}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-sm text-white/80">
              홈 › 먹이정보 › {food.name}
            </p>
            <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">
              {food.emoji} {food.name}, 먹어도 되나요?
            </h1>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href={`/tools/food/${food.slug}?species=dog`}
          className={`rounded-full px-3 py-1.5 text-xs font-bold ${
            species === "dog"
              ? "bg-primary text-white"
              : "bg-gray-100 text-muted"
          }`}
        >
          🐶 강아지 · {FOOD_LEVEL_LABEL[food.dog]}
        </Link>
        <Link
          href={`/tools/food/${food.slug}?species=cat`}
          className={`rounded-full px-3 py-1.5 text-xs font-bold ${
            species === "cat"
              ? "bg-primary text-white"
              : "bg-gray-100 text-muted"
          }`}
        >
          🐱 고양이 · {FOOD_LEVEL_LABEL[food.cat]}
        </Link>
      </div>

      <div className={`mt-5 rounded-2xl ${tone.soft} p-5 ring-1 ${tone.ring}`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-sm font-black text-white ${tone.bg}`}>
            {FOOD_LEVEL_LABEL[level]}
          </span>
          <span className={`text-sm font-bold ${tone.text}`}>
            {FOOD_LEVEL_HINT[level]}
          </span>
        </div>
        <p className={`mt-3 text-sm font-semibold leading-relaxed ${tone.text}`}>
          {food.verdict[species]}
        </p>
        {food.dog !== food.cat && (
          <p className="mt-2 text-xs text-muted">
            참고: {other === "dog" ? "강아지" : "고양이"}는{" "}
            <strong className={FOOD_LEVEL_TONE[otherLevel].text}>
              {FOOD_LEVEL_LABEL[otherLevel]}
            </strong>{" "}
            등급입니다.
          </p>
        )}
      </div>

      <section className="mt-8 space-y-4">
        <article className="rounded-2xl bg-white p-5 shadow-[var(--card-shadow)]">
          <h2 className="font-bold text-primary">왜 그런가요?</h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground/90">
            {food.why}
          </p>
          {food.speciesNote[species] ? (
            <p className="mt-3 rounded-xl bg-primary/5 px-3 py-2 text-sm text-primary">
              <strong>종별 포인트:</strong> {food.speciesNote[species]}
            </p>
          ) : null}
        </article>

        <article className="rounded-2xl bg-white p-5 shadow-[var(--card-shadow)]">
          <h2 className="font-bold text-amber-700">나타날 수 있는 증상</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {food.symptoms.map((s) => (
              <span
                key={s}
                className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 ring-1 ring-amber-100"
              >
                {s}
              </span>
            ))}
          </div>
        </article>

        <article className="rounded-2xl bg-white p-5 shadow-[var(--card-shadow)]">
          <h2 className="font-bold text-red-700">먹었다면 이렇게</h2>
          <ol className="mt-3 space-y-2">
            {food.actionSteps.map((step, i) => (
              <li
                key={step}
                className="flex gap-3 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-950"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </article>

        {food.myths.length > 0 && (
          <article className="rounded-2xl bg-white p-5 shadow-[var(--card-shadow)]">
            <h2 className="font-bold text-violet-700">자주 있는 오해</h2>
            <div className="mt-3 space-y-3">
              {food.myths.map((m) => (
                <div key={m.q} className="rounded-xl bg-violet-50 px-3 py-3">
                  <p className="text-sm font-bold text-violet-900">Q. {m.q}</p>
                  <p className="mt-1 text-sm text-violet-950/90">A. {m.a}</p>
                </div>
              ))}
            </div>
          </article>
        )}

        <article className="rounded-2xl bg-white p-5 shadow-[var(--card-shadow)]">
          <h2 className="font-bold text-emerald-700">더 안전한 대안</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {food.safeAlternatives.map((a) => (
              <Pill key={a} color="emerald">
                {a}
              </Pill>
            ))}
          </div>
        </article>
      </section>

      <section className="mt-10">
        <h2 className="font-bold text-foreground">다른 음식도 확인</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {related.map((item) => (
            <Link
              key={item.slug}
              href={`/tools/food/${item.slug}?species=${species}`}
              className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-muted shadow-[var(--card-shadow)] hover:text-primary"
            >
              {item.emoji} {item.name}
            </Link>
          ))}
        </div>
      </section>

      <p className="mt-10 text-xs leading-relaxed text-muted">
        이 정보는 참고용입니다. 응급·이상 증상은 반드시 수의사와 상담하세요.
      </p>
    </main>
  );
}
