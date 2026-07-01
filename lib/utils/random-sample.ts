function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** slug·페이지 기준 고정 셔플 — 새로고침해도 동일 목록 */
export function sampleStableRandom<T>(
  items: readonly T[],
  count: number,
  seed: string
): T[] {
  if (items.length <= count) return [...items];

  const copy = [...items];
  let state = hashString(seed);

  for (let i = copy.length - 1; i > 0; i--) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const j = state % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy.slice(0, count);
}

/** Fisher–Yates 셔플 후 최대 count개 반환 (매 요청마다 다름) */
export function sampleRandom<T>(items: readonly T[], count: number): T[] {
  if (items.length <= count) return [...items];

  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}
