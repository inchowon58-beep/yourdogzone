"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { BREED_GROUP_TABS, type BreedGroupTab } from "@/lib/breeds/config";

export function BreedGroupTabs({ activeTab }: { activeTab: BreedGroupTab }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function hrefFor(tab: BreedGroupTab) {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "all") params.delete("tab");
    else params.set("tab", tab);
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {BREED_GROUP_TABS.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <Link
            key={tab.id}
            href={hrefFor(tab.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              active
                ? "bg-primary text-white shadow-sm"
                : "bg-gray-100 text-muted hover:bg-gray-200 hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
