import { sampleStableRandom } from "@/lib/utils/random-sample";

/** 페이지(seed)마다 노출 섹션을 조금씩 다르게 — 전부 넣을 필요 없음 */
export function pickGuideSections<T extends string>(
  all: readonly T[],
  seedKey: string,
  opts?: { min?: number; max?: number; always?: readonly T[] }
): Set<T> {
  const always = new Set(opts?.always ?? []);
  const optional = all.filter((id) => !always.has(id));
  const min = opts?.min ?? 3;
  const max = Math.min(opts?.max ?? 5, optional.length);
  const count = Math.max(
    min,
    Math.min(max, min + (sampleStableRandom([0, 1, 2], 1, `${seedKey}-n`)[0] ?? 0))
  );
  const picked = sampleStableRandom(optional, count, `${seedKey}-sections`);
  return new Set<T>([...always, ...picked]);
}

/** FAQ·후기 개수도 페이지마다 약간 다르게 */
export function pickCount(
  seedKey: string,
  min: number,
  max: number,
  tag: string
): number {
  const span = Math.max(0, max - min);
  const offset = sampleStableRandom(
    Array.from({ length: span + 1 }, (_, i) => i),
    1,
    `${seedKey}-${tag}-cnt`
  )[0];
  return min + (offset ?? 0);
}
