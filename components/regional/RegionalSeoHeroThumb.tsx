type Props = {
  imageSrc: string;
  keyword: string;
  badge: string;
  line2: string;
  bar: string;
};

/**
 * 네이버/웹문서 썸네일형 상단 — CDN 사진 + 키워드 오버레이
 * (화이트파크 GuideHeroThumb과 동일 구성, 브랜드는 유아독존)
 */
export function RegionalSeoHeroThumb({
  imageSrc,
  keyword,
  badge,
  line2,
  bar,
}: Props) {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[720px] overflow-hidden rounded-2xl shadow-[var(--card-shadow)] ring-1 ring-white/80">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageSrc}
        alt={`${keyword} 대표 이미지`}
        className="absolute inset-0 h-full w-full object-cover"
        loading="eager"
        decoding="async"
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(15,23,42,0.12)_0%,rgba(15,23,42,0.5)_100%)]" />
      <div className="pointer-events-none absolute inset-3 rounded-xl border border-white/90 md:inset-4" />

      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <span className="rounded-full bg-[linear-gradient(135deg,#0f766e,#0d9488)] px-4 py-1.5 text-[0.7rem] font-semibold tracking-wide text-white shadow-md md:text-xs">
          {badge}
        </span>

        <h1 className="mt-5 max-w-[16ch] text-[clamp(1.85rem,6.5vw,3.15rem)] font-bold leading-[1.2] text-white drop-shadow-[0_3px_10px_rgba(0,0,0,0.55)]">
          <span className="block">{keyword}</span>
          <span className="mt-1 block text-teal-100 drop-shadow-[0_3px_10px_rgba(0,0,0,0.5)]">
            {line2}
          </span>
        </h1>

        <p className="mt-6 max-w-md rounded-full bg-[rgba(0,0,0,0.55)] px-5 py-2.5 text-[0.8rem] font-medium leading-snug text-white md:text-[0.95rem]">
          {bar}
        </p>
      </div>
    </div>
  );
}
