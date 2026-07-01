/** Fisher–Yates 셔플 후 최대 count개 반환 */
export function sampleRandom<T>(items: readonly T[], count: number): T[] {
  if (items.length <= count) return [...items];

  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}
