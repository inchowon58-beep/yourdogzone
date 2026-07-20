"use client";

import { useCallback, useEffect, useState } from "react";
import type { ShelterPartnerStatus } from "@/lib/types/care-shelter-partner";

type Partner = {
  id: string;
  shelter_name: string;
  contact_name: string;
  phone: string;
  email: string;
  address: string;
  status: ShelterPartnerStatus;
  created_at: string;
};

const STATUS_LABEL: Record<ShelterPartnerStatus, string> = {
  pending: "승인 대기",
  approved: "승인됨",
  rejected: "거절",
};

export function CareShelterPartnerAdminPanel() {
  const [items, setItems] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/care-shelter-partners");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "목록을 불러오지 못했습니다.");
        setItems([]);
        return;
      }
      setItems(data.partners ?? []);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function changeStatus(id: string, status: ShelterPartnerStatus) {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/admin/care-shelter-partners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "상태 변경 실패");
        return;
      }
      setItems((prev) =>
        prev.map((p) => (p.id === id ? data.partner : p))
      );
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) return <p className="text-sm text-muted">불러오는 중…</p>;
  if (error) {
    return (
      <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <p className="rounded-xl bg-gray-50 px-4 py-6 text-center text-sm text-muted">
        등록된 보호소 파트너가 없습니다.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {items.map((p) => (
        <li
          key={p.id}
          className="rounded-2xl border border-gray-100 bg-white p-4 shadow-[var(--card-shadow)]"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-foreground">
                {p.shelter_name}
              </p>
              <p className="mt-1 text-xs text-muted">
                {p.contact_name} · {p.phone} · {p.email}
              </p>
              <p className="mt-1 text-xs text-muted">{p.address}</p>
            </div>
            <select
              value={p.status}
              disabled={updatingId === p.id}
              onChange={(e) =>
                void changeStatus(p.id, e.target.value as ShelterPartnerStatus)
              }
              className="h-9 rounded-lg border border-gray-200 px-2 text-xs font-semibold"
            >
              {(Object.keys(STATUS_LABEL) as ShelterPartnerStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
        </li>
      ))}
    </ul>
  );
}
