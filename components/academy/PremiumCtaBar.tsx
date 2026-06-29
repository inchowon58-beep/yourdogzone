"use client";

import { useState } from "react";
import { MessageCircle, Phone, X } from "lucide-react";
import type { Academy } from "@/lib/types/academy";

export function PremiumCtaBar({ academy }: { academy: Academy }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-indigo-100 bg-white/95 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">
              {academy.name}
            </p>
            <p className="truncate text-xs text-primary">⭐ 인증 추천 학원</p>
          </div>
          <div className="flex shrink-0 gap-2">
            {academy.kakao_url && (
              <a
                href={academy.kakao_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl bg-[#FEE500] px-4 py-2.5 text-sm font-semibold text-[#3C1E1E]"
              >
                <MessageCircle className="h-4 w-4" />
                카카오 상담
              </a>
            )}
            {academy.phone && (
              <a
                href={`tel:${academy.phone.replace(/-/g, "")}`}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white"
              >
                <Phone className="h-4 w-4" />
                전화 상담
              </a>
            )}
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="rounded-xl border border-primary px-4 py-2.5 text-sm font-semibold text-primary"
            >
              상담 신청
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
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

      <div className="h-20" aria-hidden />
    </>
  );
}
