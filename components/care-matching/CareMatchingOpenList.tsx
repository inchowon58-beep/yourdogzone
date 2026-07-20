"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Clock, Lock, Users } from "lucide-react";
import type { CareIntakePublicItem } from "@/lib/types/care-intake";
import { formatManwon, formatRemaining, manwonToWon } from "@/lib/care-matching/matching-logic-client";

type Viewer = {
  isAdmin: boolean;
  isPartner: boolean;
  canViewPhotos: boolean;
  canBid: boolean;
  partner: { shelter_name: string } | null;
};

type Props = {
  limit?: number;
  page?: number;
  showViewAll?: boolean;
};

export function CareMatchingOpenList({
  limit = 5,
  page = 1,
  showViewAll = true,
}: Props) {
  const [items, setItems] = useState<CareIntakePublicItem[]>([]);
  const [viewer, setViewer] = useState<Viewer>({
    isAdmin: false,
    isPartner: false,
    canViewPhotos: false,
    canBid: false,
    partner: null,
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/care-matching/open?page=${page}&pageSize=${limit}`,
        { cache: "no-store", credentials: "include" }
      );
      const data = await res.json();
      setItems(data.items ?? []);
      setViewer(
        data.viewer ?? {
          isAdmin: false,
          isPartner: false,
          canViewPhotos: false,
          canBid: false,
          partner: null,
        }
      );
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [limit, page]);

  useEffect(() => {
    void load();
    const onAuthChange = () => void load();
    window.addEventListener("auth-changed", onAuthChange);
    return () => window.removeEventListener("auth-changed", onAuthChange);
  }, [load]);

  if (loading) {
    return (
      <p className="text-center text-sm text-muted">매칭 목록 불러오는 중…</p>
    );
  }

  return (
    <div className="space-y-3">
      {viewer.isPartner && viewer.partner && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-base">
          <span className="font-semibold text-primary">
            {viewer.partner.shelter_name}
          </span>
          <span className="text-foreground"> 보호소 파트너로 로그인됨</span>
          <span className="mt-1 block text-sm text-muted">
            「돌봄비용 제안하기」로 입소 분담금을 등록할 수 있습니다. 다른
            보호소의 제안 금액은 볼 수 없습니다.
          </span>
        </div>
      )}

      {viewer.isAdmin && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-base text-emerald-900">
          <span className="font-semibold">관리자</span>로 보는 중 — 모든
          신청·사진·상태가 표시됩니다.
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-8 text-center">
          <p className="text-base text-muted">
            현재 진행 중인 안심입소 매칭이 없습니다.
          </p>
          <p className="mt-2 text-sm text-muted">
            신청·입금 확인 후 매칭 리스트에 표시됩니다.
          </p>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {items.map((item) => (
              <CareMatchingOpenListItem
                key={item.id}
                item={item}
                viewer={viewer}
                onBidSubmitted={load}
              />
            ))}
          </ul>
          {showViewAll && (
            <div className="text-center">
              <Link
                href="/care-matching/list"
                className="inline-flex text-base font-semibold text-primary hover:underline"
              >
                리스트 전체보기
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CareMatchingOpenListItem({
  item,
  viewer,
  onBidSubmitted,
}: {
  item: CareIntakePublicItem;
  viewer: Viewer;
  onBidSubmitted: () => void;
}) {
  const [openBid, setOpenBid] = useState(false);
  const [amount, setAmount] = useState("");
  const [bidding, setBidding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitBid() {
    setError(null);
    const man = Number(amount.replace(/[^\d.]/g, ""));
    if (!Number.isFinite(man) || man < 1) {
      setError("1만 원 이상(숫자만) 입력해 주세요. 예: 55 → 55만원");
      return;
    }
    if (!Number.isInteger(man)) {
      setError("만원 단위 정수로 입력해 주세요. 예: 55");
      return;
    }
    const won = manwonToWon(man);
    setBidding(true);
    try {
      const res = await fetch("/api/care-matching/partner/bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ application_id: item.id, amount: won }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "제안 등록에 실패했습니다.");
        return;
      }
      setAmount("");
      setOpenBid(false);
      onBidSubmitted();
    } finally {
      setBidding(false);
    }
  }

  const speciesLabel = item.species === "dog" ? "강아지" : "고양이";
  const waitLabel =
    item.phase === "matching_select"
      ? "선택대기 남은시간"
      : item.phase === "matching"
        ? "매칭대기 남은시간"
        : "매칭 준비";
  const waitValue =
    item.phase === "other"
      ? "준비중"
      : formatRemaining(item.remaining_ms);

  return (
    <li className="rounded-2xl border border-gray-100 bg-white p-3 shadow-[var(--card-shadow)] sm:p-4">
      <div className="flex items-stretch gap-3">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:h-28 sm:w-28">
          {item.photo_url ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.photo_url}
                alt=""
                className={`h-full w-full object-cover ${
                  item.photo_locked ? "scale-110 blur-md" : ""
                }`}
              />
              {item.photo_locked && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/35 px-1 text-center">
                  <Lock className="h-4 w-4 text-white" aria-hidden />
                  <span className="mt-1 text-[11px] font-semibold leading-tight text-white">
                    파트너
                    <br />
                    회원 전용
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted">
              사진 없음
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 items-stretch gap-2 sm:gap-3">
          <div className="flex min-w-0 flex-1 flex-col justify-center">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-bold text-foreground sm:text-xl">
                {speciesLabel}
              </p>
              {item.status_label && (
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-muted">
                  {item.status_label}
                </span>
              )}
            </div>
            {viewer.canViewPhotos && (
              <p className="mt-1 truncate text-base text-muted">
                {item.breed}
                {item.pet_name ? ` · ${item.pet_name}` : ""}
                {item.age_text ? ` · ${item.age_text}` : ""}
              </p>
            )}
            {!viewer.canViewPhotos && (
              <p className="mt-1 text-sm text-muted">
                상세·사진은 보호소 파트너 회원만 확인할 수 있습니다
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-stretch gap-1.5 sm:gap-2">
            <div className="flex w-[5.25rem] flex-col items-center justify-center self-stretch rounded-xl bg-amber-50 px-1 sm:w-32 sm:px-2">
              <Clock
                className="h-5 w-5 text-amber-700"
                aria-hidden
              />
              <p className="mt-1 text-center text-[11px] font-semibold leading-tight text-muted sm:text-xs">
                {waitLabel}
              </p>
              <p className="mt-1 text-center text-base font-black leading-tight text-amber-800 sm:text-lg">
                {waitValue}
              </p>
            </div>

            <div className="flex w-[5.25rem] flex-col items-center justify-center self-stretch rounded-xl bg-primary/10 px-1.5 sm:w-32 sm:px-2">
              <Users
                className="h-5 w-5 text-primary"
                aria-hidden
              />
              <p className="mt-1 text-center text-[11px] font-semibold leading-tight text-muted sm:text-xs">
                참여 보호소
              </p>
              <p className="mt-1 text-center text-3xl font-black tabular-nums leading-none text-primary sm:text-4xl">
                {item.participant_count}
              </p>
              <p className="mt-0.5 text-sm font-bold text-primary">곳</p>
            </div>
          </div>
        </div>
      </div>

      {viewer.isPartner && item.my_bid_amount != null && (
        <div className="mt-3 space-y-2">
          <div className="flex w-full items-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5">
            <p className="text-base font-semibold leading-relaxed text-emerald-900">
              <span className="font-bold">
                {viewer.partner?.shelter_name ?? "보호소"}
              </span>{" "}
              님은 현재{" "}
              <span className="text-lg font-black text-emerald-700">
                {formatManwon(item.my_bid_amount)}
              </span>
              으로 돌봄비용을 제안하셨습니다.
              <span className="ml-1 text-sm font-bold text-emerald-700/80">
                (변경불가)
              </span>
            </p>
          </div>
          <p className="rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-2.5 text-sm leading-relaxed text-amber-900/90">
            매칭 완료 후 입소 거부 시, 다음부터 추가 돌봄비용 제안이
            제한됩니다.
          </p>
        </div>
      )}

      {item.bid_excluded && viewer.isPartner && (
        <p className="mt-3 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-800">
          신청자가 제외한 보호소로 등록되어 이 건에는 제안할 수 없습니다.
        </p>
      )}

      {item.can_bid && (
        <div className="mt-3 border-t border-gray-100 pt-3">
          {!openBid ? (
            <button
              type="button"
              onClick={() => setOpenBid(true)}
              className="h-12 w-full rounded-xl bg-primary text-base font-bold text-white shadow-sm hover:bg-primary-hover"
            >
              돌봄비용 제안하기
            </button>
          ) : (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
              <p className="text-sm font-semibold text-foreground">
                제안할 돌봄비용 (만원 단위)
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <div className="flex h-10 items-center overflow-hidden rounded-lg border border-gray-200 bg-white">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={amount}
                    onChange={(e) =>
                      setAmount(e.target.value.replace(/[^\d]/g, ""))
                    }
                    placeholder="예: 55"
                    className="h-full w-28 px-3 text-sm outline-none"
                    autoFocus
                  />
                  <span className="shrink-0 border-l border-gray-200 bg-gray-50 px-2.5 text-sm font-bold text-foreground">
                    만원
                  </span>
                </div>
                <button
                  type="button"
                  disabled={bidding}
                  onClick={() => void submitBid()}
                  className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {bidding ? "등록 중…" : "제안 등록"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpenBid(false);
                    setError(null);
                  }}
                  className="h-10 rounded-lg px-3 text-sm text-muted hover:text-foreground"
                >
                  취소
                </button>
              </div>
              {amount && Number(amount) >= 1 && (
                <p className="mt-2 text-xs font-semibold text-primary">
                  → {formatManwon(manwonToWon(Number(amount)))} 으로 제안됩니다
                </p>
              )}
              <p className="mt-1.5 text-sm text-muted">
                만원 단위로 입력해 주세요. 예: 55 입력 → 55만원 · 등록 후 변경
                불가
              </p>
              <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm leading-relaxed text-amber-900/90">
                매칭 완료 후 입소 거부 시, 다음부터 추가 돌봄비용 제안이
                제한됩니다.
              </p>
              {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
            </div>
          )}
        </div>
      )}

      {item.phase === "matching" &&
        !viewer.isPartner &&
        !item.can_bid && (
          <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2.5 text-sm text-muted">
            「돌봄비용 제안하기」는{" "}
            <Link
              href="/login"
              className="font-semibold text-primary hover:underline"
            >
              보호소 파트너 로그인
            </Link>
            후 이 목록에서 확인할 수 있습니다.
          </p>
        )}

      {item.phase === "other" && viewer.isPartner && !item.bid_excluded && (
        <p className="mt-3 text-sm text-muted">
          아직 제안 접수 전입니다. 관리자 심사승인 후 「돌봄비용 제안하기」가
          표시됩니다.
        </p>
      )}

      {item.phase === "matching_select" && viewer.isPartner && (
        <p className="mt-3 text-sm text-muted">
          제안 접수가 마감되어 신청자 선택 대기 중입니다.
        </p>
      )}

      {!viewer.canViewPhotos && (
        <p className="mt-3 text-sm text-muted">
          사진·상세 정보는{" "}
          <Link
            href="/login"
            className="font-semibold text-primary hover:underline"
          >
            보호소 파트너 로그인
          </Link>
          후 확인할 수 있습니다.
        </p>
      )}
    </li>
  );
}
