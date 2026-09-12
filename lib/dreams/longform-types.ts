export type DreamLongform = {
  omen: "길몽" | "흉몽" | "심리몽" | "길흉혼재";
  /** 감성 타이틀 (인터랙티브 결과용) */
  headline: string;
  /** 한눈에 보는 요약 */
  summaryBox: string;
  /** 상징·종합 해몽 (길게) */
  symbolism: string;
  /** 상황별 세부 해석 */
  details: { title: string; body: string }[];
  /** 무의식 심리 */
  psychology: string;
  /** 오늘 실천 케어 팁 */
  careTip: string;
  /** 본문 중간 인용 포인트 */
  quote: string;
  generatedAt: string;
  source: "gemini" | "fallback";
};

export function dreamLongformCharCount(doc: DreamLongform): number {
  const parts = [
    doc.headline,
    doc.summaryBox,
    doc.symbolism,
    doc.psychology,
    doc.careTip,
    doc.quote,
    ...doc.details.flatMap((d) => [d.title, d.body]),
  ];
  return parts.join("").replace(/\s+/g, "").length;
}
