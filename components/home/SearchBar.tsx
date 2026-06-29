"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Search } from "lucide-react";

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/dynamic-landing/${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div className="group relative flex items-center">
        <Search className="absolute left-5 h-5 w-5 text-muted transition-colors group-focus-within:text-primary" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="원하는 키워드를 입력하세요"
          className="h-14 w-full rounded-2xl bg-white pl-14 pr-28 text-base text-foreground shadow-[var(--card-shadow)] outline-none transition-shadow placeholder:text-gray-400 focus:shadow-[var(--card-shadow-hover)] focus:ring-2 focus:ring-primary/20"
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
