"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  CARE_DELIVERY_STATUS_LABEL,
  CARE_INTAKE_STATUS_LABEL,
  type CareApplicantBidView,
  type CareDeliveryStatus,
  type CareIntakeApplication,
  type CareIntakeStatus,
} from "@/lib/types/care-intake";
import { formatManwon } from "@/lib/care-matching/matching-logic-client";

type SafeApp = Omit<CareIntakeApplication, "portal_password_hash">;

type BankInfo = {
  bank: string;
  account: string;
  holder: string;
  note: string;
};

export function CareIntakeMyPortal() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [application, setApplication] = useState<SafeApp | null>(null);
  const [bids, setBids] = useState<CareApplicantBidView[]>([]);
  const [bank, setBank] = useState<BankInfo | null>(null);
  const [selectedBid, setSelectedBid] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);

  async function handleLookup(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/care-matching/applicant/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guardian_phone: phone,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "조회 실패");
        setApplication(null);
        setBids([]);
        setBank(null);
        return;
      }
      setApplication(data.application);
      setBids(data.bids ?? []);
      setBank(data.bank ?? null);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function refreshBids() {
    const res = await fetch("/api/care-matching/applicant/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guardian_phone: phone, password }),
    });
    const data = await res.json();
    if (res.ok) {
      setBids(data.bids ?? []);
      if (data.application) setApplication(data.application);
      setBank(data.bank ?? null);
    }
  }

  async function closeBidding() {
    if (!application) return;
    if (!confirm("매칭 대기를 종료하고 제안 금액을 확인하시겠습니까?")) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/care-matching/applicant/close-bidding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: application.id,
          guardian_phone: phone,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "처리 실패");
        return;
      }
      setApplication(data.application);
      await refreshBids();
    } finally {
      setActionLoading(false);
    }
  }

  async function confirmMatch() {
    if (!application || !selectedBid) return;
    if (!confirm("선택한 제안 금액으로 매칭을 확정하시겠습니까?")) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/care-matching/applicant/select-bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: application.id,
          bid_id: selectedBid,
          guardian_phone: phone,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "매칭 실패");
        return;
      }
      setApplication(data.application);
      await refreshBids();
    } finally {
      setActionLoading(false);
    }
  }

  async function requestDelivery() {
    if (!application) return;
    if (
      !confirm(
        "유아독존 안심 딜리버리를 신청하시겠습니까? 신청 후 입금 계좌가 안내됩니다."
      )
    ) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(
        "/api/care-matching/applicant/request-delivery",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: application.id,
            guardian_phone: phone,
            password,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "신청 실패");
        return;
      }
      setApplication(data.application);
      setBank(data.bank ?? null);
    } finally {
      setActionLoading(false);
    }
  }

  async function requestIntakePhoto() {
    if (!application) return;
    if (!confirm("입소 사진을 요청하시겠습니까?")) return;
    setActionLoading(true);
    try {
      const res = await fetch(
        "/api/care-matching/applicant/request-intake-photo",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: application.id,
            guardian_phone: phone,
            password,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "요청 실패");
        return;
      }
      setApplication(data.application);
      alert("입소 사진 요청이 접수되었습니다. 담당자가 사진을 전달해 드립니다.");
    } finally {
      setActionLoading(false);
    }
  }

  async function cancelIntake() {
    if (!application) return;
    if (
      !confirm(
        "입소를 취소하시겠습니까?\n취소하시면 해당 아이는 무료분양 「가족을 기다리는 아이들」 목록에 우선 노출됩니다."
      )
    ) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch("/api/care-matching/applicant/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: application.id,
          guardian_phone: phone,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "취소 실패");
        return;
      }
      setApplication(data.application);
      alert(
        data.message ??
          "입소가 취소되었습니다. 홈 무료분양 목록에서 확인할 수 있습니다."
      );
    } finally {
      setActionLoading(false);
    }
  }

  const deliveryStatus: CareDeliveryStatus =
    application?.delivery_status ?? "none";
  const canCancel =
    application &&
    application.status !== "cancelled" &&
    deliveryStatus !== "completed" &&
    deliveryStatus !== "photo_requested";

  return (
    <div className="w-full min-w-0">
      {!application ? (
        <form
          onSubmit={handleLookup}
          className="mx-auto w-full max-w-xl rounded-2xl border border-gray-100 bg-white p-5 shadow-[var(--card-shadow)] sm:p-6"
        >
          <p className="text-sm text-muted">
            신청 시 설정한 연락처와 조회 비밀번호를 입력해 주세요.
          </p>
          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold">
                보호자 연락처
              </span>
              <input
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputCls}
                placeholder="010-0000-0000"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold">
                조회 비밀번호
              </span>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputCls}
              />
            </label>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 h-11 w-full rounded-xl bg-primary text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "조회 중…" : "내 신청 조회"}
          </button>
        </form>
      ) : (
        <div className="grid w-full gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[var(--card-shadow)] sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-bold text-foreground sm:text-xl">
                    {application.species === "dog" ? "강아지" : "고양이"}{" "}
                    {application.pet_name} ({application.breed})
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    신청 ID: {application.id}
                  </p>
                </div>
                <StatusBadge status={application.status} />
              </div>

              {application.photo_urls?.[0] && (
                <div className="mt-4 overflow-hidden rounded-xl bg-gray-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={application.photo_urls[0]}
                    alt=""
                    className="mx-auto max-h-64 w-full object-contain"
                  />
                </div>
              )}

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                <Row
                  label="매칭 대기"
                  value={`${application.matching_hours}시간`}
                />
                <Row
                  label="상태"
                  value={CARE_INTAKE_STATUS_LABEL[application.status]}
                />
                {application.matching_ends_at && (
                  <Row
                    label="제안 마감"
                    value={new Date(
                      application.matching_ends_at
                    ).toLocaleString("ko-KR")}
                  />
                )}
                {application.selection_ends_at && (
                  <Row
                    label="선택 기한"
                    value={new Date(
                      application.selection_ends_at
                    ).toLocaleString("ko-KR")}
                  />
                )}
              </dl>

              {application.excluded_shelters?.length > 0 && (
                <p className="mt-3 text-xs text-muted">
                  제외 보호소: {application.excluded_shelters.join(", ")}
                </p>
              )}

              {application.status === "matching" && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => void closeBidding()}
                  className="mt-4 h-11 w-full rounded-xl border border-primary bg-primary/5 text-sm font-semibold text-primary"
                >
                  매칭하기 (제안 조기 종료)
                </button>
              )}

              {application.status === "matching_select" && (
                <p className="mt-3 text-sm text-muted">
                  아래 제안 금액 중 하나를 선택해 매칭을 확정해 주세요. 48시간
                  내 선택하지 않으면 자동 만료됩니다.
                </p>
              )}

              {canCancel && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => void cancelIntake()}
                  className="mt-4 h-11 w-full rounded-xl border border-red-200 bg-red-50 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                >
                  입소취소
                </button>
              )}

              {application.status === "cancelled" && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <p className="font-semibold">입소가 취소되었습니다.</p>
                  <p className="mt-1 text-[13px] leading-relaxed">
                    해당 아이는 홈의 무료분양 「가족을 기다리는 아이들」에 우선
                    노출됩니다.
                  </p>
                  <Link
                    href={`/free-adoption/${application.id}`}
                    className="mt-2 inline-block font-semibold text-primary hover:underline"
                  >
                    무료분양 상세 보기 →
                  </Link>
                </div>
              )}
            </div>

            {/* 딜리버리 */}
            {application.status === "matched" && (
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[var(--card-shadow)] sm:p-6">
                <h2 className="text-base font-bold text-foreground sm:text-lg">
                  유아독존 안심 딜리버리
                </h2>
                <p className="mt-1 text-sm text-muted">
                  보호소까지 안전하게 모셔다 드리는 배송 서비스입니다.
                </p>

                {deliveryStatus === "none" && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => void requestDelivery()}
                    className="mt-4 h-12 w-full rounded-xl bg-primary text-sm font-bold text-white disabled:opacity-60 sm:text-base"
                  >
                    유아독존 안심딜리버리 신청
                  </button>
                )}

                {deliveryStatus !== "none" && (
                  <div className="mt-4 space-y-3">
                    <p className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary sm:text-sm">
                      {CARE_DELIVERY_STATUS_LABEL[deliveryStatus]}
                    </p>

                    {deliveryStatus === "deposit_pending" && bank && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
                        <p className="font-bold">입금 계좌 안내</p>
                        <dl className="mt-2 space-y-1 text-[13px]">
                          <div className="flex gap-2">
                            <dt className="w-16 shrink-0 text-emerald-800/80">
                              은행
                            </dt>
                            <dd className="font-semibold">{bank.bank}</dd>
                          </div>
                          <div className="flex gap-2">
                            <dt className="w-16 shrink-0 text-emerald-800/80">
                              계좌
                            </dt>
                            <dd className="font-semibold tracking-wide">
                              {bank.account}
                            </dd>
                          </div>
                          <div className="flex gap-2">
                            <dt className="w-16 shrink-0 text-emerald-800/80">
                              예금주
                            </dt>
                            <dd className="font-semibold">{bank.holder}</dd>
                          </div>
                        </dl>
                        <p className="mt-2 text-[12px] leading-relaxed text-emerald-900/80">
                          {bank.note}
                        </p>
                      </div>
                    )}

                    {deliveryStatus === "assigning" && (
                      <p className="rounded-xl bg-sky-50 px-4 py-3 text-sm leading-relaxed text-sky-950">
                        입금이 확인되었습니다.{" "}
                        <strong>담당자 배정 후 연락</strong>드리겠습니다.
                      </p>
                    )}

                    {deliveryStatus === "ready_to_depart" && (
                      <p className="rounded-xl bg-sky-50 px-4 py-3 text-sm leading-relaxed text-sky-950">
                        출발 대기 중입니다. 담당자가 픽업·이동 일정을 안내해
                        드립니다.
                      </p>
                    )}

                    {deliveryStatus === "completed" && (
                      <div className="space-y-3">
                        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm leading-relaxed text-emerald-950">
                          입소가 완료되었습니다. 아이에게 필요한 사진이 있으면
                          요청해 주세요.
                        </p>
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => void requestIntakePhoto()}
                          className="h-11 w-full rounded-xl border border-primary bg-primary/5 text-sm font-semibold text-primary disabled:opacity-60"
                        >
                          입소사진요청하기
                        </button>
                      </div>
                    )}

                    {deliveryStatus === "photo_requested" && (
                      <p className="rounded-xl bg-violet-50 px-4 py-3 text-sm leading-relaxed text-violet-950">
                        입소 사진 요청이 접수되었습니다. 담당자가 확인 후
                        전달해 드립니다.
                      </p>
                    )}

                    <DeliverySteps current={deliveryStatus} />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[var(--card-shadow)] sm:p-6">
            <h2 className="text-base font-bold text-foreground sm:text-lg">
              돌봄비용 제안 현황
            </h2>
            <p className="mt-1 text-sm text-muted">
              제안 금액은 확인할 수 있습니다. 보호소명·연락처는 매칭 완료 후
              선택하신 보호소만 공개됩니다.
            </p>

            {bids.length === 0 ? (
              <p className="mt-4 text-sm text-muted">
                아직 제안한 보호소가 없습니다.
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {bids.map((bid, i) => (
                  <li
                    key={bid.id}
                    className={`rounded-xl border px-3 py-2.5 sm:px-4 sm:py-3 ${
                      bid.revealed
                        ? "border-emerald-200 bg-emerald-50/70"
                        : "border-gray-100"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-xs text-muted">제안 {i + 1}</p>
                        <p className="text-base font-bold text-foreground">
                          {formatManwon(bid.amount)}
                        </p>
                      </div>
                      {application.status === "matching_select" && (
                        <label className="flex items-center gap-1.5 text-sm font-semibold">
                          <input
                            type="radio"
                            name="bid"
                            value={bid.id}
                            checked={selectedBid === bid.id}
                            onChange={() => setSelectedBid(bid.id)}
                          />
                          선택
                        </label>
                      )}
                    </div>
                    <dl className="mt-2 grid grid-cols-2 gap-1 text-sm">
                      <div>
                        <dt className="text-xs text-muted">보호소명</dt>
                        <dd
                          className={
                            bid.revealed
                              ? "font-semibold text-emerald-900"
                              : "font-medium tracking-wider text-muted"
                          }
                        >
                          {bid.shelter_name}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted">연락처</dt>
                        <dd
                          className={
                            bid.revealed
                              ? "font-semibold text-emerald-900"
                              : "font-medium tracking-wider text-muted"
                          }
                        >
                          {bid.shelter_phone}
                        </dd>
                      </div>
                    </dl>
                    {bid.revealed && (
                      <p className="mt-1.5 text-xs font-semibold text-emerald-700">
                        매칭 완료 · 업체 정보가 공개되었습니다
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {application.status === "matching_select" && bids.length > 0 && (
              <button
                type="button"
                disabled={actionLoading || !selectedBid}
                onClick={() => void confirmMatch()}
                className="mt-4 h-11 w-full rounded-xl bg-primary text-sm font-semibold text-white disabled:opacity-60"
              >
                매칭 확정
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setApplication(null);
              setBids([]);
              setSelectedBid("");
              setBank(null);
            }}
            className="text-sm text-muted hover:text-primary lg:col-span-2"
          >
            ← 다시 조회
          </button>
        </div>
      )}

      <p className="mt-8 text-center text-xs text-muted">
        <Link href="/" className="hover:text-primary">
          홈으로
        </Link>
      </p>
    </div>
  );
}

function DeliverySteps({ current }: { current: CareDeliveryStatus }) {
  const steps: CareDeliveryStatus[] = [
    "deposit_pending",
    "assigning",
    "ready_to_depart",
    "completed",
    "photo_requested",
  ];
  const labels: Record<CareDeliveryStatus, string> = {
    none: "",
    deposit_pending: "입금대기",
    assigning: "담당자 배정중",
    ready_to_depart: "출발대기중",
    completed: "입소완료",
    photo_requested: "입소사진요청",
  };
  const idx = steps.indexOf(current);

  return (
    <ol className="flex flex-wrap gap-1.5 pt-1">
      {steps.map((s, i) => (
        <li
          key={s}
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold sm:text-xs ${
            i <= idx
              ? "bg-primary text-white"
              : "bg-gray-100 text-muted"
          }`}
        >
          {labels[s]}
        </li>
      ))}
    </ol>
  );
}

function StatusBadge({ status }: { status: CareIntakeStatus }) {
  return (
    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
      {CARE_INTAKE_STATUS_LABEL[status]}
    </span>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-semibold text-foreground">{value}</dd>
    </div>
  );
}

const inputCls =
  "h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-primary/40";
