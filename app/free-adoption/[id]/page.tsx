import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  Cat,
  Dog,
  Heart,
  Scale,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { CARE_CHIP_LABEL, type CareChipType } from "@/lib/types/care-intake";
import { getFreeAdoptionById } from "@/lib/care-matching/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const pet = await getFreeAdoptionById(id);
  if (!pet) {
    return { title: "무료분양" };
  }
  return buildPageMetadata({
    title: `${pet.pet_name} — 무료분양`,
    description: `${pet.breed} · 가족을 기다리는 ${pet.pet_name} 상세 정보`,
    path: `/free-adoption/${id}`,
    ogSubtitle: "무료분양",
  });
}

function genderLabel(gender: string | null): string {
  if (gender === "male" || gender === "남" || gender === "수컷") return "수컷";
  if (gender === "female" || gender === "여" || gender === "암컷") return "암컷";
  return gender || "—";
}

function boolLabel(v: boolean | null): string {
  if (v === true) return "완료";
  if (v === false) return "미완료";
  return "미확인";
}

export default async function FreeAdoptionDetailPage({ params }: Props) {
  const { id } = await params;
  const pet = await getFreeAdoptionById(id);
  if (!pet) notFound();

  const speciesLabel = pet.species === "dog" ? "강아지" : "고양이";
  const SpeciesIcon = pet.species === "dog" ? Dog : Cat;
  const hero = pet.photo_urls[0] ?? null;
  const gallery = pet.photo_urls.slice(1);

  const quickFacts = [
    { label: "품종", value: pet.breed || "—" },
    { label: "나이", value: pet.age_text || "—" },
    {
      label: "몸무게",
      value: pet.weight_kg != null ? `${pet.weight_kg}kg` : "—",
    },
    { label: "성별", value: genderLabel(pet.gender) },
  ];

  const careFacts = [
    { label: "중성화", value: boolLabel(pet.neutered) },
    { label: "예방접종", value: boolLabel(pet.vaccinated) },
    {
      label: "동물등록",
      value: pet.chip_type
        ? (CARE_CHIP_LABEL[pet.chip_type as CareChipType] ?? pet.chip_type)
        : "미확인",
    },
  ];

  const storyBlocks = [
    {
      title: "성격",
      icon: Sparkles,
      body: pet.personality,
    },
    {
      title: "질병·수술 이력",
      icon: Stethoscope,
      body: pet.medical_history,
    },
    {
      title: "현재 건강",
      icon: ShieldCheck,
      body: pet.current_illness,
    },
  ].filter((b) => b.body && b.body.trim());

  return (
    <main className="w-full min-w-0 px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/#agapet-adoption-heading"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        무료분양 목록으로
      </Link>

      <article className="mt-6 sm:mt-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start lg:gap-10">
          {/* 사진 */}
          <div className="min-w-0">
            <div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-amber-50 via-orange-50/80 to-rose-50 shadow-[var(--card-shadow)]">
              {hero ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={hero}
                  alt={`${pet.pet_name} 대표 사진`}
                  className="aspect-[4/5] w-full object-cover sm:aspect-[5/6]"
                />
              ) : (
                <div className="flex aspect-[4/5] flex-col items-center justify-center gap-3 text-muted sm:aspect-[5/6]">
                  <SpeciesIcon className="h-12 w-12 opacity-40" />
                  <p className="text-sm">사진 준비 중</p>
                </div>
              )}
              <span className="absolute left-3 top-3 rounded-full bg-amber-600 px-3 py-1 text-xs font-bold text-white shadow-sm sm:left-4 sm:top-4 sm:text-sm">
                무료분양
              </span>
            </div>

            {gallery.length > 0 && (
              <ul className="mt-3 grid grid-cols-3 gap-2 sm:mt-4 sm:gap-3">
                {gallery.map((url, i) => (
                  <li key={url}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`${pet.pet_name} 사진 ${i + 2}`}
                      className="aspect-square w-full rounded-xl object-cover"
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 정보 */}
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-[0.16em] text-primary sm:text-sm">
              FREE ADOPTION
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              {pet.pet_name}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted sm:text-base">
              <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                <SpeciesIcon className="h-4 w-4 text-primary" aria-hidden />
                {speciesLabel}
              </span>
              <span aria-hidden>·</span>
              <span>{pet.breed}</span>
              {pet.age_text ? (
                <>
                  <span aria-hidden>·</span>
                  <span>{pet.age_text}</span>
                </>
              ) : null}
              <span aria-hidden>·</span>
              <span>{genderLabel(pet.gender)}</span>
            </p>

            <p className="mt-4 text-[15px] leading-relaxed text-muted sm:text-base">
              새로운 가족을 기다리는 아이예요. 아래 정보를 확인한 뒤, 입양
              문의는 유아독존으로 연락해 주세요.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-2.5 sm:gap-3">
              {quickFacts.map((f) => (
                <div
                  key={f.label}
                  className="rounded-2xl border border-gray-100 bg-white px-3.5 py-3 shadow-[var(--card-shadow)] sm:px-4 sm:py-3.5"
                >
                  <p className="text-[11px] font-semibold tracking-wide text-muted sm:text-xs">
                    {f.label}
                  </p>
                  <p className="mt-1 truncate text-sm font-bold text-foreground sm:text-[15px]">
                    {f.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-gray-100 bg-white p-4 shadow-[var(--card-shadow)] sm:p-5">
              <h2 className="flex items-center gap-2 text-sm font-bold text-foreground sm:text-base">
                <Heart className="h-4 w-4 text-rose-500" aria-hidden />
                케어 정보
              </h2>
              <dl className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {careFacts.map((f) => (
                  <div
                    key={f.label}
                    className="flex items-start justify-between gap-3 rounded-xl bg-gray-50 px-3 py-2.5"
                  >
                    <dt className="shrink-0 text-xs font-semibold text-muted">
                      {f.label}
                    </dt>
                    <dd className="text-right text-sm font-semibold text-foreground">
                      {f.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {storyBlocks.length > 0 && (
              <div className="mt-5 space-y-3">
                {storyBlocks.map((block) => {
                  const Icon = block.icon;
                  return (
                    <section
                      key={block.title}
                      className="rounded-2xl border border-gray-100 bg-white p-4 shadow-[var(--card-shadow)] sm:p-5"
                    >
                      <h2 className="flex items-center gap-2 text-sm font-bold text-foreground sm:text-base">
                        <Icon className="h-4 w-4 text-primary" aria-hidden />
                        {block.title}
                      </h2>
                      <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">
                        {block.body}
                      </p>
                    </section>
                  );
                })}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <Link
                href="/#agapet-adoption-heading"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover"
              >
                다른 아이 더 보기
              </Link>
              <Link
                href="/care-matching"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:text-primary"
              >
                안심입소 안내
              </Link>
            </div>

            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted sm:text-[13px]">
              <Scale className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              입양 전 생활 환경·책임 여부를 충분히 고려해 주세요. 문의는
              유아독존을 통해 안내받을 수 있습니다.
            </p>
          </div>
        </div>
      </article>
    </main>
  );
}
