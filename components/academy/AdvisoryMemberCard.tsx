import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, MessageCircle } from "lucide-react";
import { GoldCertificationBadge } from "@/components/academy/GoldCertificationBadge";
import type { AdvisoryMember } from "@/lib/types/advisory-member";

type Props = {
  member: AdvisoryMember;
};

function resolvePhotoSrc(url?: string): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;
  return trimmed;
}
export function AdvisoryMemberCard({ member }: Props) {
  const photoSrc = resolvePhotoSrc(member.profilePhotoUrl);
  const displayName = member.name.trim() || member.title;

  return (
    <article className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm">
      <div className="grid grid-cols-2 items-start gap-3 p-4 sm:gap-4 sm:p-5 md:grid-cols-[11rem_minmax(0,1fr)] md:items-center">
        <div className="col-start-1 row-start-1 justify-self-start">
          {photoSrc ? (
            <div className="relative aspect-square w-full max-w-[9.5rem] overflow-hidden rounded-xl border border-amber-100 bg-slate-50 md:h-40 md:w-40 md:max-w-none">
              <Image
                src={photoSrc}
                alt={`${displayName} 프로필`}
                fill
                className="object-cover object-[center_15%]"
                sizes="(max-width: 768px) 45vw, 160px"
                unoptimized={photoSrc.startsWith("http")}
              />
            </div>
          ) : (
            <div className="flex aspect-square w-full max-w-[9.5rem] items-center justify-center rounded-xl border border-dashed border-amber-200 bg-amber-50/50 md:h-40 md:w-40 md:max-w-none">
              <GoldCertificationBadge className="h-16 w-16 opacity-90" />
            </div>
          )}
        </div>

        <div className="col-start-2 row-start-1 min-w-0 self-center text-left">
          <p className="text-[11px] font-semibold tracking-wide text-amber-700">
            [{member.category}]
          </p>
          <h2 className="certificate-serif mt-1 text-base font-bold leading-snug text-[#1e3a8a] sm:text-lg">
            {member.title}
            {member.name.trim() ? (
              <span className="mt-0.5 block text-sm font-semibold text-slate-700 sm:text-base">
                {member.name}
              </span>
            ) : null}
          </h2>
          <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
            <BadgeCheck className="h-3 w-3" aria-hidden />
            공식 인증 자문
          </p>
          {member.description ? (
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {member.description}
            </p>
          ) : null}
          {member.kakaoUrl ? (
            <Link
              href={member.kakaoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] px-4 py-2.5 text-sm font-bold text-[#3C1E1E] shadow-sm transition hover:brightness-95 sm:w-auto"
            >
              <MessageCircle className="h-4 w-4 shrink-0" />
              1:1 카톡 상담
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
