import { ACADEMY_NO_IMAGE_URL } from "@/lib/academy/images";

type AcademyThumbnailProps = {
  src?: string | null;
  alt: string;
  className?: string;
  fit?: "cover" | "contain";
};

export function AcademyThumbnail({
  src,
  alt,
  className = "",
  fit = "cover",
}: AcademyThumbnailProps) {
  const url = src?.startsWith("http") || src?.startsWith("/") ? src : ACADEMY_NO_IMAGE_URL;
  const isPlaceholder = !src;

  return (
    <div
      className={`overflow-hidden bg-gray-100 ${className}`}
      role="img"
      aria-label={isPlaceholder ? "이미지 없음" : alt}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={isPlaceholder ? "이미지 없음" : alt}
        className={`h-full w-full ${fit === "cover" ? "object-cover" : "object-contain"}`}
        loading="lazy"
      />
    </div>
  );
}
