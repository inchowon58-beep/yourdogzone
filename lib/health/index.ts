import { CAT_GUIDES } from "@/lib/health/cats";
import { DOG_GUIDES } from "@/lib/health/dogs";
import { EXOTIC_GUIDES } from "@/lib/health/exotics";
import type {
  GuideKind,
  HealthGuide,
  HealthSpecies,
} from "@/lib/health/types";

export const HEALTH_GUIDES: HealthGuide[] = [
  ...DOG_GUIDES,
  ...CAT_GUIDES,
  ...EXOTIC_GUIDES,
];

export function getGuideBySlug(slug: string): HealthGuide | undefined {
  return HEALTH_GUIDES.find((g) => g.slug === slug);
}

export function filterGuides(options: {
  species?: HealthSpecies | "all";
  kind?: GuideKind | "all";
  q?: string;
}): HealthGuide[] {
  const species = options.species ?? "all";
  const kind = options.kind ?? "all";
  const q = (options.q ?? "").trim().toLowerCase();

  return HEALTH_GUIDES.filter((g) => {
    if (species !== "all" && !g.species.includes(species)) return false;
    if (kind !== "all" && g.kind !== kind) return false;
    if (!q) return true;
    const hay = [
      g.title,
      g.summary,
      ...g.keywords,
      ...g.signals,
      ...g.causes,
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function relatedGuides(guide: HealthGuide, limit = 6): HealthGuide[] {
  const fromIds = (guide.relatedSlugs ?? [])
    .map((s) => getGuideBySlug(s))
    .filter(Boolean) as HealthGuide[];

  if (fromIds.length >= limit) return fromIds.slice(0, limit);

  const rest = HEALTH_GUIDES.filter(
    (g) =>
      g.slug !== guide.slug &&
      !fromIds.some((x) => x.slug === g.slug) &&
      (g.species.some((s) => guide.species.includes(s)) ||
        g.system === guide.system)
  );

  return [...fromIds, ...rest].slice(0, limit);
}

export function countBySpecies(): Record<HealthSpecies | "all", number> {
  const base: Record<HealthSpecies | "all", number> = {
    all: HEALTH_GUIDES.length,
    dog: 0,
    cat: 0,
    reptile: 0,
    bird: 0,
    small: 0,
    fish: 0,
  };
  for (const g of HEALTH_GUIDES) {
    for (const s of g.species) base[s] += 1;
  }
  return base;
}
