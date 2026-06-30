"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { Search } from "lucide-react";

export function AcademySearchBar({ defaultQuery = "" }: { defaultQuery?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(defaultQuery);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = query.trim();
    if (trimmed) {
      params.set("q", trimmed);
    } else {
      params.delete("q");
    }
    router.push(`/services/academy?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div className="group relative flex items-center">
        <Search className="absolute left-4 h-5 w-5 text-muted transition-colors group-focus-within:text-primary sm:left-5" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="학원명, 지역, 주소로 검색"
          className="h-12 w-full rounded-2xl bg-white pl-11 pr-[4.75rem] text-sm shadow-[var(--card-shadow)] outline-none transition-shadow placeholder:text-gray-400 focus:shadow-[var(--card-shadow-hover)] focus:ring-2 focus:ring-primary/20 sm:h-14 sm:pl-14 sm:pr-28 sm:text-base"
        />
        <button
          type="submit"
          className="absolute right-1.5 h-9 rounded-xl bg-primary px-3 text-xs font-semibold text-white transition-colors hover:bg-primary-hover sm:right-2 sm:h-10 sm:px-5 sm:text-sm"
        >
          검색
        </button>
      </div>
    </form>
  );
}
