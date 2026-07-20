import Link from "next/link";
import { listSiteSideBanners } from "@/lib/site/side-banners-store";
import type { SiteSideBanner } from "@/lib/types/site-banner";

/** 헤더·푸터·본문 공통 가로 레일 */
export const SITE_CONTENT_MAX = "max-w-[92rem]";

function BannerColumn({
  banners,
  side,
}: {
  banners: SiteSideBanner[];
  side: "left" | "right";
}) {
  if (banners.length === 0) {
    return (
      <div
        className={`hidden w-[9.5rem] shrink-0 xl:block 2xl:w-44 ${
          side === "left" ? "pr-1" : "pl-1"
        }`}
        aria-hidden
      />
    );
  }

  return (
    <aside
      className={`hidden w-[9.5rem] shrink-0 xl:block 2xl:w-44 ${
        side === "left" ? "pr-1" : "pl-1"
      }`}
      aria-label={side === "left" ? "왼쪽 배너" : "오른쪽 배너"}
    >
      <div className="sticky top-20 flex flex-col gap-3">
        {banners.map((b) => (
          <Link
            key={b.id}
            href={b.href || "/"}
            className="group block overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[var(--card-shadow)] transition hover:shadow-md"
            title={b.title}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={b.image_url}
              alt={b.title}
              className="h-auto w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            />
          </Link>
        ))}
      </div>
    </aside>
  );
}

/** 전 페이지 공통: 가로 레일 + 좌우 배너 */
export async function SiteWideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const banners = await listSiteSideBanners({ enabledOnly: true });
  const left = banners.filter((b) => b.slot === "left");
  const right = banners.filter((b) => b.slot === "right");

  return (
    <div className="flex w-full min-w-0 justify-center px-3 sm:px-4 lg:px-6">
      <div
        className={`flex w-full ${SITE_CONTENT_MAX} items-start gap-3 2xl:gap-5`}
      >
        <BannerColumn banners={left} side="left" />
        <div className="min-w-0 flex-1">{children}</div>
        <BannerColumn banners={right} side="right" />
      </div>
    </div>
  );
}
