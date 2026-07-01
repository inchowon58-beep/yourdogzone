type Props = {
  src: string;
  alt: string;
  className?: string;
};

/** Vercel 이미지 최적화(/_next/image) 우회 — 로컬·R2 모두 직접 로드 */
export function ProfilePhoto({
  src,
  alt,
  className = "object-cover object-[center_15%]",
}: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={`h-full w-full ${className}`}
      loading="lazy"
      decoding="async"
    />
  );
}
