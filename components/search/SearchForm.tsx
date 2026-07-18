"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function SearchForm({ defaultQuery = "" }: { defaultQuery?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultQuery);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      router.push("/search");
      return;
    }
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="group relative flex items-center">
        <Search className="absolute left-4 h-5 w-5 text-muted group-focus-within:text-primary" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="증상, 병명, 음식 이름을 입력하세요"
          className="h-12 w-full rounded-2xl bg-white pl-11 pr-24 text-sm shadow-[var(--card-shadow)] outline-none focus:ring-2 focus:ring-primary/20 sm:h-14 sm:text-base"
          autoFocus
        />
        <button
          type="submit"
          className="absolute right-1.5 h-9 rounded-xl bg-primary px-4 text-xs font-semibold text-white hover:bg-primary-hover sm:right-2 sm:h-10 sm:text-sm"
        >
          검색
        </button>
      </div>
    </form>
  );
}
