/** 공식 자문단 헤드라인 강조색 — 검붉은 톤 */
export const ADVISORY_HEADLINE_ACCENT = "#7B1818";

type Props = {
  as?: "h1" | "h2";
  size?: "banner" | "page";
  className?: string;
};

export function AdvisoryBannerHeadline({
  as: Tag = "h2",
  size = "banner",
  className = "",
}: Props) {
  const isPage = size === "page";

  const accentClass = isPage
    ? "text-[1.65rem] font-extrabold leading-tight sm:text-[2rem] md:text-[2.25rem]"
    : "text-lg font-extrabold leading-tight sm:text-xl";

  const bodyClass = isPage
    ? "text-base font-medium leading-snug text-slate-700 sm:text-lg md:text-xl"
    : "text-sm font-medium leading-snug text-slate-700 sm:text-base";

  return (
    <Tag
      className={`leading-snug text-foreground ${className}`}
    >
      <span className={accentClass} style={{ color: ADVISORY_HEADLINE_ACCENT }}>
        가짜 영수증 리뷰
      </span>
      <span className={bodyClass}>, 광고로 도배된 블로그 글에 </span>
      <span className={accentClass} style={{ color: ADVISORY_HEADLINE_ACCENT }}>
        아직도
      </span>
      <span className={bodyClass}> 속고 계십니까?</span>
    </Tag>
  );
}
