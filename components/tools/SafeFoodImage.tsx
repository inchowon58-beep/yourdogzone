"use client";

import { useState } from "react";

/** 외부/로컬 이미지 — 실패 시 이모지 플레이스홀더 */
export function SafeFoodImage({
  src,
  alt,
  emoji,
  className = "h-full w-full object-cover",
}: {
  src: string;
  alt: string;
  emoji: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-4xl"
        role="img"
        aria-label={alt}
      >
        {emoji}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
