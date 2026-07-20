export function formatRemaining(ms: number | null): string {
  if (ms === null) return "—";
  if (ms <= 0) return "마감";
  const totalMin = Math.ceil(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h >= 48) return `${Math.floor(h / 24)}일 ${h % 24}시간`;
  if (h > 0) return `${h}시간 ${m}분`;
  return `${m}분`;
}

/** 원 → "55만원" 표시 (만원 단위) */
export function formatManwon(won: number): string {
  if (!Number.isFinite(won) || won <= 0) return "—";
  const man = Math.round(won / 10000);
  return `${man.toLocaleString("ko-KR")}만원`;
}

/** 입력 만원 → 원 */
export function manwonToWon(manwon: number): number {
  return Math.round(manwon) * 10000;
}
