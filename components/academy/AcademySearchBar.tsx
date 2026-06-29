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
        <Search className="absolute left-5 h-5 w-5 text-muted transition-colors group-focus-within:text-primary" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="학원명, 지역, 주소로 검색"
          className="h-14 w-full rounded-2xl bg-white pl-14 pr-28 text-base shadow-[var(--card-shadow)] outline-none transition-shadow placeholder:text-gray-400 focus:shadow-[var(--card-shadow-hover)] focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="submit"
          className="absolute right-2 h-10 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          검색
        </button>
      </div>
    </form>
  );
}
