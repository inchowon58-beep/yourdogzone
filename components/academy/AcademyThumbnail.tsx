import { AcademyNoImage } from "@/components/academy/AcademyNoImage";

type AcademyThumbnailProps = {
  src?: string | null;
  alt: string;
  className?: string;
  fit?: "cover" | "contain";
  /** 이미지 없을 때 placeholder 표시 여부 (인증추천 등은 false) */
  showPlaceholder?: boolean;
};

export function AcademyThumbnail({
  src,
  alt,
  className = "",
  fit = "cover",
  showPlaceholder = true,
}: AcademyThumbnailProps) {
  const hasImage = Boolean(src?.startsWith("http") || src?.startsWith("/"));

  if (!hasImage) {
    if (!showPlaceholder) return null;
    return <AcademyNoImage className={className} iconClassName="h-7 w-7" />;
  }

  return (
    <div className={`relative w-full max-w-full overflow-hidden bg-gray-100 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src!}
        alt={alt}
        className={`h-full w-full max-w-full ${fit === "cover" ? "object-cover" : "object-contain"}`}
        loading="lazy"
      />
    </div>
  );
}
