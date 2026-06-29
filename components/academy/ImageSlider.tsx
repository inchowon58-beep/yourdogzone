"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type ImageSliderProps = {
  images: string[];
  alt: string;
};

export function ImageSlider({ images, alt }: ImageSliderProps) {
  const [index, setIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-gray-50 text-sm text-muted">
        학원 이미지 준비 중
      </div>
    );
  }

  const prev = () => setIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setIndex((i) => (i === images.length - 1 ? 0 : i + 1));

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gray-100 shadow-[var(--card-shadow)]">
      <div
        className="h-72 bg-cover bg-center transition-all sm:h-96"
        style={{ backgroundImage: `url(${images[index]})` }}
        role="img"
        aria-label={`${alt} ${index + 1}`}
      />
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md transition hover:bg-white"
            aria-label="이전 이미지"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md transition hover:bg-white"
            aria-label="다음 이미지"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all ${
                  i === index ? "w-6 bg-white" : "w-2 bg-white/60"
                }`}
                aria-label={`${i + 1}번째 이미지`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
