import type { HealthGuide } from "@/lib/health/types";

type Input = Omit<HealthGuide, "keywords"> & { keywords?: string[] };

export function guide(input: Input): HealthGuide {
  return {
    ...input,
    keywords: input.keywords ?? [
      input.title,
      ...input.species,
      input.kind,
      input.system,
    ],
  };
}
