"use client";

import { useState } from "react";
import { MessageCircle, Phone, X } from "lucide-react";
import type { Academy } from "@/lib/types/academy";

export function PremiumCtaBar({ academy }: { academy: Academy }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-indigo-100 bg-white/95 px-3 py-2.5 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-md sm:px-4 sm:py-3">
        <div className="mx-auto max-w-4xl">
          <div className="mb-2 min-w-0 sm:mb-0 sm:hidden">
            <p className="truncate text-sm font-bold text-foreground">
              {academy.name}
            </p>
            <p className="truncate text-xs text-primary">⭐ 인증 추천 학원</p>
          </div>
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-bold text-foreground">
                {academy.name}
              </p>
              <p className="truncate text-xs text-primary">⭐ 인증 추천 학원</p>
            </div>
            <div className="flex w-full shrink-0 gap-1.5 sm:w-auto sm:gap-2">
              {academy.kakao_url && (
                <a
                  href={academy.kakao_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#FEE500] px-2 py-2 text-xs font-semibold text-[#3C1E1E] sm:flex-none sm:gap-1.5 sm:px-4 sm:py-2.5 sm:text-sm"
                >
                  <MessageCircle className="h-4 w-4 shrink-0" />
                  <span>카카오</span>
                </a>
              )}
              {academy.phone && (
                <a
                  href={`tel:${academy.phone.replace(/-/g, "")}`}
                  className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-primary px-2 py-2 text-xs font-semibold text-white sm:flex-none sm:gap-1.5 sm:px-4 sm:py-2.5 sm:text-sm"
                >
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>전화</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="flex-1 rounded-xl border border-primary px-2 py-2 text-xs font-semibold text-primary sm:flex-none sm:px-4 sm:py-2.5 sm:text-sm"
              >
                상담
              </button>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">상담 신청</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                aria-label="닫기"
              >
                <X className="h-5 w-5 text-muted" />
              </button>
            </div>
            <p className="text-sm leading-relaxed text-muted">
              <strong className="text-foreground">{academy.name}</strong>에
              관심을 가져주셔서 감사합니다. 아래 연락처로 상담을 요청해 주세요.
            </p>
            {academy.phone && (
              <a
                href={`tel:${academy.phone.replace(/-/g, "")}`}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white"
              >
                <Phone className="h-4 w-4" />
                {academy.phone}
              </a>
            )}
          </div>
        </div>
      )}

      <div className="h-24 sm:h-20" aria-hidden />
    </>
  );
}
