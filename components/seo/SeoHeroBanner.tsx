import { DEFAULT_SEO_HERO_OVERLAY } from "@/lib/seo/seo-hero";

export function SeoHeroBanner({
  imageUrl,
  overlayColor,
  line1,
  line2,
}: {
  imageUrl: string;
  overlayColor?: string | null;
  line1?: string | null;
  line2?: string | null;
}) {
  const color = overlayColor?.trim() || DEFAULT_SEO_HERO_OVERLAY;
  const title = line1?.trim() || "";
  const subtitle = line2?.trim() || "";

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="relative aspect-[16/9] w-full sm:aspect-[21/9]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={title || "SEO 배너"}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ backgroundColor: color, opacity: 0.46 }}
        />
        {title || subtitle ? (
          <div className="absolute inset-0 flex flex-col justify-end px-5 py-5 sm:px-7 sm:py-6">
            {title ? (
              <p className="text-[1.35rem] font-extrabold leading-snug tracking-tight text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.45)] sm:text-2xl">
                {title}
              </p>
            ) : null}
            {subtitle ? (
              <p className="mt-1.5 text-sm font-medium leading-relaxed text-white/90 drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)] sm:text-base">
                {subtitle}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
