"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Rocket, Sparkles, X } from "lucide-react";

type AcademyOwnerPromoBannerProps = {
  academyName?: string;
  /** 신청 완료 후 이동할 경로 (기본: 학원 등록 페이지) */
  applyHref?: string;
};

const DEFAULT_APPLY_HREF = "/services/academy/register";

export function AcademyOwnerPromoBanner({
  academyName = "",
  applyHref = DEFAULT_APPLY_HREF,
}: AcademyOwnerPromoBannerProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [hasWebsite, setHasWebsite] = useState<"no" | "yes">("no");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (academyName) params.set("academy", academyName);
    if (ownerName) params.set("owner", ownerName);
    if (phone) params.set("phone", phone);
    params.set("website", hasWebsite);
    params.set("promo", "owner-upgrade");

    const qs = params.toString();
    router.push(qs ? `${applyHref}?${qs}` : applyHref);
    setShowModal(false);
  }

  return (
    <>
      <section
        className="relative mt-10 overflow-hidden rounded-2xl border border-white/10 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.45)]"
        aria-label="학원 원장님 무료 홈페이지 제작 혜택"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950" />
        <div
          className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-400/10 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-indigo-500/15 blur-3xl"
          aria-hidden
        />

        <div className="relative px-5 py-8 sm:px-8 sm:py-10">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">
            <Sparkles className="h-3.5 w-3.5" />
            유아독존 공식 제휴 혜택
          </div>

          <h2 className="text-xl font-bold leading-snug tracking-tight text-white sm:text-2xl md:text-[1.65rem]">
            아직도 매달{" "}
            <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
              수백만 원씩 네이버 광고비
            </span>
            로
            <br className="hidden sm:block" />
            버리고 계십니까?
          </h2>

          <ul className="mt-6 space-y-4">
            <li className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <span className="text-lg" aria-hidden>
                💡
              </span>
              <p className="text-sm leading-relaxed text-slate-200 sm:text-[0.95rem]">
                <span className="font-semibold text-white">
                  홈페이지가 없으신가요?
                </span>{" "}
                수강생이 저절로 모이는 고품질 웹사이트를{" "}
                <span className="font-semibold text-amber-300">100% 무료</span>
                로 제작해 드립니다.
              </p>
            </li>
            <li className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <span className="text-lg" aria-hidden>
                🚀
              </span>
              <p className="text-sm leading-relaxed text-slate-200 sm:text-[0.95rem]">
                <span className="font-semibold text-white">
                  이미 홈페이지가 있으신가요?
                </span>{" "}
                네이버 1페이지를 장악하는 웹문서 자동 발행 시스템을 탑재해{" "}
                <span className="font-semibold text-amber-300">3배 업그레이드</span>
                해 드립니다.
              </p>
            </li>
          </ul>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="group mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-3.5 text-sm font-bold text-slate-900 shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-500/30 active:scale-[0.98] sm:w-auto sm:px-8 sm:text-base"
          >
            <span>👉 [선착순 10개 학원] 무료 지원 및 업그레이드 신청하기</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="owner-promo-title"
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <Rocket className="h-3.5 w-3.5" />
                  무료 지원 신청
                </p>
                <h3
                  id="owner-promo-title"
                  className="mt-1 text-lg font-bold text-foreground"
                >
                  학원 홈페이지 무료 제작·업그레이드
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-muted hover:bg-gray-100"
                aria-label="닫기"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {academyName && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted">
                    학원명
                  </label>
                  <input
                    type="text"
                    value={academyName}
                    readOnly
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-foreground"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="owner-name"
                  className="mb-1.5 block text-xs font-medium text-muted"
                >
                  원장님 성함 <span className="text-primary">*</span>
                </label>
                <input
                  id="owner-name"
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="홍길동"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label
                  htmlFor="owner-phone"
                  className="mb-1.5 block text-xs font-medium text-muted"
                >
                  연락처 <span className="text-primary">*</span>
                </label>
                <input
                  id="owner-phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010-0000-0000"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <fieldset>
                <legend className="mb-2 text-xs font-medium text-muted">
                  홈페이지 보유 여부
                </legend>
                <div className="flex gap-3">
                  <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <input
                      type="radio"
                      name="hasWebsite"
                      value="no"
                      checked={hasWebsite === "no"}
                      onChange={() => setHasWebsite("no")}
                      className="accent-primary"
                    />
                    없음 (무료 제작)
                  </label>
                  <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <input
                      type="radio"
                      name="hasWebsite"
                      value="yes"
                      checked={hasWebsite === "yes"}
                      onChange={() => setHasWebsite("yes")}
                      className="accent-primary"
                    />
                    있음 (업그레이드)
                  </label>
                </div>
              </fieldset>

              <button
                type="submit"
                className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                신청하기
              </button>

              <p className="text-center text-xs text-muted">
                이미 등록된 학원이신가요?{" "}
                <Link
                  href={applyHref}
                  className="font-medium text-primary hover:underline"
                  onClick={() => setShowModal(false)}
                >
                  학원 정보 등록 바로가기
                </Link>
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
