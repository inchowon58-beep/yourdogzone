import { ImageOff } from "lucide-react";

type AcademyNoImageProps = {
  className?: string;
  iconClassName?: string;
};

/** 이미지 없음 — 아이콘만 표시 (텍스트 없음) */
export function AcademyNoImage({
  className = "",
  iconClassName = "h-10 w-10",
}: AcademyNoImageProps) {
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-slate-100 via-gray-100 to-slate-200 ${className}`}
      role="img"
      aria-label="등록된 이미지 없음"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200/80 bg-white/70 shadow-sm">
        <ImageOff className={`text-gray-400 ${iconClassName}`} strokeWidth={1.5} />
      </div>
    </div>
  );
}
