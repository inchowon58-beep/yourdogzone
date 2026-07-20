import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  AGAPET_PETS_BOARD_URL,
  formatAgapetGender,
  formatAgapetStatus,
  listAgapetPetsForHome,
  type AgapetPet,
} from "@/lib/agapet/pets";
import { listFreeAdoptionFromCancelled } from "@/lib/care-matching/queries";
import type { CareFreeAdoptionPublic } from "@/lib/types/care-intake";

type HomePetCard = {
  key: string;
  name: string;
  meta: string;
  photoUrl: string | null;
  href: string;
  badge: string;
  badgeClass: string;
  external?: boolean;
};

function formatGender(gender: string | null | undefined): string {
  if (gender === "female" || gender === "여" || gender === "암컷") return "여";
  if (gender === "male" || gender === "남" || gender === "수컷") return "남";
  return gender?.trim() || "";
}

function fromCancelled(pet: CareFreeAdoptionPublic): HomePetCard {
  const speciesLabel = pet.species === "dog" ? "강아지" : "고양이";
  const meta = [pet.breed || speciesLabel, pet.age_text, formatGender(pet.gender)]
    .filter(Boolean)
    .join(" · ");
  return {
    key: `care-${pet.id}`,
    name: pet.pet_name,
    meta,
    photoUrl: pet.photo_urls[0] ?? null,
    href: `/free-adoption/${pet.id}`,
    badge: "입양가능",
    badgeClass: "bg-emerald-600",
  };
}

function fromAgapet(pet: AgapetPet): HomePetCard {
  const meta = [pet.species, pet.age, formatAgapetGender(pet.gender)]
    .filter(Boolean)
    .join(" · ");
  return {
    key: `agapet-${pet.id}`,
    name: pet.name,
    meta,
    photoUrl: pet.photoUrl,
    href: pet.href,
    badge: formatAgapetStatus(pet.status),
    badgeClass:
      pet.status === "waiting" ? "bg-emerald-600" : "bg-slate-500",
    external: true,
  };
}

function PetCard({ pet }: { pet: HomePetCard }) {
  const inner = (
    <>
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {pet.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pet.photoUrl}
            alt={`${pet.name} 사진`}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            사진 준비 중
          </div>
        )}
        <span
          className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-bold text-white shadow-sm sm:left-2.5 sm:top-2.5 sm:text-xs ${pet.badgeClass}`}
        >
          {pet.badge}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 px-3 py-3 sm:px-3.5 sm:py-3.5">
        <p className="truncate text-[15px] font-bold tracking-tight text-foreground sm:text-base">
          {pet.name}
        </p>
        {pet.meta ? (
          <p className="truncate text-xs text-muted sm:text-[13px]">{pet.meta}</p>
        ) : null}
      </div>
    </>
  );

  const className =
    "group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[var(--card-shadow)] transition duration-200 hover:-translate-y-0.5 hover:shadow-md";

  if (pet.external) {
    return (
      <a
        href={pet.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link href={pet.href} className={className}>
      {inner}
    </Link>
  );
}

export async function AgapetAdoptionSection() {
  const [cancelled, agapet] = await Promise.all([
    listFreeAdoptionFromCancelled(12),
    listAgapetPetsForHome(12),
  ]);

  const cards: HomePetCard[] = [
    ...cancelled.map(fromCancelled),
    ...agapet.map(fromAgapet),
  ].slice(0, 12);

  if (cards.length === 0) return null;

  return (
    <section
      aria-labelledby="agapet-adoption-heading"
      className="w-full min-w-0 px-1 pb-4 pt-2 sm:pb-6 sm:pt-4"
    >
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-6">
        <div>
          <p className="text-xs font-bold tracking-[0.14em] text-primary sm:text-sm">
            입양가능
          </p>
          <h2
            id="agapet-adoption-heading"
            className="mt-1 text-xl font-black tracking-tight text-foreground sm:text-2xl"
          >
            가족을 기다리는 아이들
          </h2>
          <p className="mt-1.5 text-sm text-muted sm:text-[15px]">
            입소 철회·보호소 아이들에게 새 가족을 소개해요.
          </p>
        </div>
        <Link
          href={AGAPET_PETS_BOARD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          아가펫 전체 보기
          <ArrowUpRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 md:gap-5">
        {cards.map((pet) => (
          <li key={pet.key}>
            <PetCard pet={pet} />
          </li>
        ))}
      </ul>
    </section>
  );
}
