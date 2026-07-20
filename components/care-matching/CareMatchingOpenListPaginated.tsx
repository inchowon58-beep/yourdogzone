"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CareMatchingOpenList } from "@/components/care-matching/CareMatchingOpenList";

type Props = {
  initialPage: number;
};

export function CareMatchingOpenListPaginated({ initialPage }: Props) {
  const [page, setPage] = useState(initialPage);
  const [total, setTotal] = useState(0);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const loadMeta = useCallback(async () => {
    const res = await fetch(
      `/api/care-matching/open?page=${page}&pageSize=${pageSize}`,
      { cache: "no-store" }
    );
    const data = await res.json();
    setTotal(data.total ?? 0);
  }, [page]);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("page", String(page));
    window.history.replaceState(null, "", url.toString());
  }, [page]);

  return (
    <div>
      <CareMatchingOpenList
        limit={pageSize}
        page={page}
        showViewAll={false}
        key={page}
      />

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            이전
          </button>
          <span className="text-sm text-muted">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            다음
          </button>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-muted">
        보호소 파트너가 아니신가요?{" "}
        <Link href="/care-matching/partner" className="font-semibold text-primary">
          회원가입·로그인
        </Link>
      </p>
    </div>
  );
}
