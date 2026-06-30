"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AcademyNoImage } from "@/components/academy/AcademyNoImage";

type ImageSliderProps = {
  images: string[];
  alt: string;
};

export function ImageSlider({ images, alt }: ImageSliderProps) {
  const [index, setIndex] = useState(0);

  if (images.length === 0) {
    return (
      <AcademyNoImage
        className="mx-auto aspect-[4/3] w-full max-w-3xl rounded-2xl shadow-[var(--card-shadow)]"
        iconClassName="h-12 w-12"
      />
    );
  }

  const prev = () => setIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setIndex((i) => (i === images.length - 1 ? 0 : i + 1));

  return (
    <div className="flex justify-center overflow-hidden">
      <div className="relative w-full max-w-full sm:w-fit">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[index]}
          alt={`${alt} ${index + 1}`}
          className="mx-auto block max-h-[min(60vh,640px)] w-full max-w-full rounded-2xl bg-white object-contain shadow-[var(--card-shadow)] sm:max-h-[min(70vh,640px)] sm:w-auto"
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
    </div>
  );
}
