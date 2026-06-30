import type { BreedKind, BreedSizeGroup } from "@/lib/types/breed";

export type BreedGroupTab = "all" | BreedSizeGroup | "designer";

export const BREED_SIZE_GROUPS: BreedSizeGroup[] = [
  "toy",
  "small",
  "medium",
  "large",
  "giant",
];

export const BREED_GROUP_TABS: { id: BreedGroupTab; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "toy", label: "초소형" },
  { id: "small", label: "소형" },
  { id: "medium", label: "중형" },
  { id: "large", label: "대형" },
  { id: "giant", label: "초대형" },
  { id: "designer", label: "디자이너·믹스" },
];

export const BREED_SIZE_LABELS: Record<BreedSizeGroup, string> = {
  toy: "초소형",
  small: "소형",
  medium: "중형",
  large: "대형",
  giant: "초대형",
};

export const BREED_KIND_LABELS: Record<BreedKind, string> = {
  purebred: "순종",
  designer: "디자이너·믹스",
};

export function breedDetailPath(slug: string): string {
  return `/dognose/${slug}`;
}

export function matchesBreedTab(
  breed: { kind: BreedKind; size_group: BreedSizeGroup },
  tab: BreedGroupTab
): boolean {
  if (tab === "all") return true;
  if (tab === "designer") return breed.kind === "designer";
  return breed.kind === "purebred" && breed.size_group === tab;
}
