"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CARE_CHIP_LABEL,
  CARE_DELIVERY_STATUS_LABEL,
  CARE_DELIVERY_STATUS_OPTIONS,
  CARE_INTAKE_STATUS_LABEL,
  type CareChipType,
  type CareDeliveryStatus,
  type CareIntakeApplication,
  type CareIntakeStatus,
} from "@/lib/types/care-intake";

const STATUS_OPTIONS: CareIntakeStatus[] = [
  "pending_deposit",
  "deposit_confirmed",
  "pending_review",
  "matching",
  "matching_select",
  "matched",
  "expired",
  "cancelled",
];

export function CareIntakeAdminPanel() {
  const [items, setItems] = useState<CareIntakeApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/care-intake");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "목록을 불러오지 못했습니다.");
        setItems([]);
        return;
      }
      setItems(data.applications ?? []);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function changeStatus(
    id: number | string,
    status: CareIntakeStatus
  ) {
    setUpdatingId(String(id));
    try {
      const res = await fetch("/api/admin/care-intake", {
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
        prev.map((a) => (String(a.id) === String(id) ? data.application : a))
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function changeDeliveryStatus(
    id: number | string,
    delivery_status: CareDeliveryStatus
  ) {
    setUpdatingId(String(id));
    try {
      const res = await fetch("/api/admin/care-intake", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, delivery_status }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "딜리버리 상태 변경 실패");
        return;
      }
      setItems((prev) =>
        prev.map((a) => (String(a.id) === String(id) ? data.application : a))
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function approve(id: number | string) {
    if (
      !confirm(
        "심사승인하면 매칭이 시작되고 보호소 파트너들에게 알림이 발송됩니다. 진행할까요?"
      )
    ) {
      return;
    }
    setUpdatingId(String(id));
    try {
      const res = await fetch("/api/admin/care-intake", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "approve" }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "심사승인 실패");
        return;
      }
      setItems((prev) =>
        prev.map((a) => (String(a.id) === String(id) ? data.application : a))
      );
      alert("심사승인 완료. 매칭이 시작되었습니다.");
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted">불러오는 중…</p>;
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
        <button
          type="button"
          onClick={() => void load()}
          className="ml-3 font-semibold underline"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="rounded-xl bg-gray-50 px-4 py-6 text-center text-sm text-muted">
        접수된 안심입소 신청이 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">총 {items.length}건</p>
      <ul className="space-y-4">
        {items.map((app) => (
          <li
            key={String(app.id)}
            className="rounded-2xl border border-gray-100 bg-white p-4 shadow-[var(--card-shadow)] sm:p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-foreground">
                  {app.species === "dog" ? "강아지" : "고양이"} · {app.pet_name}{" "}
                  ({app.breed})
                </p>
                <p className="mt-1 text-xs text-muted">
                  {new Date(app.created_at).toLocaleString("ko-KR")} · ID{" "}
                  {app.id}
                </p>
                <p className="mt-1 text-xs text-muted">
                  매칭 대기 {app.matching_hours ?? 24}시간
                </p>
                <p className="mt-2 inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                  {CARE_INTAKE_STATUS_LABEL[app.status]}
                </p>
              </div>
              <select
                value={app.status}
                disabled={updatingId === String(app.id)}
                onChange={(e) =>
                  void changeStatus(
                    app.id,
                    e.target.value as CareIntakeStatus
                  )
                }
                className="h-9 rounded-lg border border-gray-200 px-2 text-xs font-semibold"
                aria-label="상태 변경"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {CARE_INTAKE_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>

            {/* 심사승인 — 매칭 시작 전 항상 눈에 띄게 */}
            {["pending_deposit", "deposit_confirmed", "pending_review"].includes(
              app.status
            ) && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-xs font-semibold text-emerald-900">
                  {app.status === "pending_deposit"
                    ? "입금 대기 중 — 입금이 확인되면 심사승인으로 매칭을 시작할 수 있습니다."
                    : "심사 후 승인하면 보호소 파트너에게 알림이 가고, 돌봄비용 제안 매칭이 시작됩니다."}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {app.status === "pending_deposit" && (
                    <button
                      type="button"
                      disabled={updatingId === String(app.id)}
                      onClick={() =>
                        void changeStatus(app.id, "deposit_confirmed")
                      }
                      className="h-10 rounded-lg border border-emerald-300 bg-white px-4 text-sm font-semibold text-emerald-800 disabled:opacity-60"
                    >
                      입금 확인
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={updatingId === String(app.id)}
                    onClick={() => void approve(app.id)}
                    className="h-10 flex-1 rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60 sm:flex-none sm:min-w-[12rem]"
                  >
                    심사승인 · 매칭 시작
                  </button>
                </div>
              </div>
            )}

            {app.status === "matching" && (
              <p className="mt-3 rounded-xl bg-primary/5 px-4 py-2.5 text-xs font-semibold text-primary">
                매칭 진행 중 — 보호소 파트너가 돌봄비용을 제안할 수 있습니다.
              </p>
            )}

            {(app.status === "matched" ||
              (app.delivery_status && app.delivery_status !== "none")) && (
              <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
                <p className="text-xs font-semibold text-sky-900">
                  안심 딜리버리 ·{" "}
                  {
                    CARE_DELIVERY_STATUS_LABEL[
                      app.delivery_status ?? "none"
                    ]
                  }
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <select
                    value={app.delivery_status ?? "none"}
                    disabled={updatingId === String(app.id)}
                    onChange={(e) =>
                      void changeDeliveryStatus(
                        app.id,
                        e.target.value as CareDeliveryStatus
                      )
                    }
                    className="h-9 rounded-lg border border-sky-200 bg-white px-2 text-xs font-semibold"
                    aria-label="딜리버리 상태"
                  >
                    {CARE_DELIVERY_STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {CARE_DELIVERY_STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                  {app.delivery_status === "deposit_pending" && (
                    <button
                      type="button"
                      disabled={updatingId === String(app.id)}
                      onClick={() =>
                        void changeDeliveryStatus(app.id, "assigning")
                      }
                      className="h-9 rounded-lg bg-sky-600 px-3 text-xs font-bold text-white disabled:opacity-60"
                    >
                      딜리버리 입금 확인 → 담당자 배정중
                    </button>
                  )}
                </div>
              </div>
            )}

            {app.photo_urls.length > 0 && (
              <div className="mt-3 flex gap-2">
                {app.photo_urls.map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <a key={url} href={url} target="_blank" rel="noreferrer">
                    <img
                      src={url}
                      alt=""
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  </a>
                ))}
              </div>
            )}

            <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-2">
              <Row label="몸무게" value={app.weight_kg ? `${app.weight_kg}kg` : "—"} />
              <Row label="나이" value={app.age_text ?? "—"} />
              <Row
                label="성별"
                value={
                  app.gender === "male"
                    ? "수컷"
                    : app.gender === "female"
                      ? "암컷"
                      : app.gender ?? "—"
                }
              />
              <Row
                label="중성화"
                value={
                  app.neutered === true
                    ? "완료"
                    : app.neutered === false
                      ? "미완료"
                      : "—"
                }
              />
              <Row
                label="접종"
                value={
                  app.vaccinated === true
                    ? "완료"
                    : app.vaccinated === false
                      ? "미완료"
                      : "—"
                }
              />
              <Row
                label="등록"
                value={
                  app.chip_type
                    ? (CARE_CHIP_LABEL[app.chip_type as CareChipType] ??
                      app.chip_type)
                    : "—"
                }
              />
              <Row label="질병·수술 이력" value={app.medical_history ?? "—"} />
              <Row label="현재 질병" value={app.current_illness ?? "—"} />
              <Row label="성격" value={app.personality ?? "—"} />
              <Row label="사유" value={app.surrender_reason ?? "—"} />
              <Row
                label="제외 보호소"
                value={
                  app.excluded_shelters?.length
                    ? app.excluded_shelters.join(", ")
                    : "—"
                }
              />
              <Row label="기타" value={app.notes ?? "—"} />
              <Row label="보호자" value={app.guardian_name} />
              <Row label="연락처" value={app.guardian_phone} />
              <Row label="주소" value={app.guardian_address} />
              <Row
                label="접수비"
                value={
                  app.deposit_amount
                    ? `${app.deposit_amount.toLocaleString("ko-KR")}원`
                    : "—"
                }
              />
              {app.matching_ends_at && (
                <Row
                  label="제안 마감"
                  value={new Date(app.matching_ends_at).toLocaleString("ko-KR")}
                />
              )}
              {app.selection_ends_at && (
                <Row
                  label="선택 기한"
                  value={new Date(app.selection_ends_at).toLocaleString(
                    "ko-KR"
                  )}
                />
              )}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 border-b border-gray-50 py-1.5 last:border-0">
      <dt className="w-24 shrink-0 font-semibold text-muted">{label}</dt>
      <dd className="min-w-0 flex-1 break-words text-foreground">{value}</dd>
    </div>
  );
}
