import Link from "next/link";
import { REGION_BIG_OPTIONS } from "@/lib/constants/regions";

type RegionTabsProps = {
  activeRegion: string;
  query?: string;
};

export function RegionTabs({ activeRegion, query }: RegionTabsProps) {
  function buildHref(region: string) {
    const params = new URLSearchParams();
    if (region !== "전체") params.set("region", region);
    if (query) params.set("q", query);
    const qs = params.toString();
    return `/services/academy${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="w-full min-w-0 overflow-hidden">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide sm:mx-0 sm:px-0">
      {REGION_BIG_OPTIONS.map((region) => {
        const isActive = activeRegion === region;
        return (
          <Link
            key={region}
            href={buildHref(region)}
            className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
              isActive
                ? "bg-primary text-white shadow-sm"
                : "bg-white text-muted shadow-[var(--card-shadow)] hover:text-foreground"
            }`}
          >
            {region}
          </Link>
        );
      })}
      </div>
    </div>
  );
}
