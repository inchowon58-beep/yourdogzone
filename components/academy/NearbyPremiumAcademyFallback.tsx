import { PremiumAcademyGrid } from "@/components/academy/PremiumAcademyGrid";
import type { Academy } from "@/lib/types/academy";
import { Info } from "lucide-react";

type Props = {
  label: string;
  academies: Academy[];
};

export function NearbyPremiumAcademyFallback({ label, academies }: Props) {
  if (academies.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3.5 sm:px-5">
        <p className="flex items-start gap-2 text-sm leading-relaxed text-amber-950">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            해당지역 추천학원이 없어 인근지역추천학원 정보가 노출됩니다.{" "}
            <strong>{label}</strong> 인근에서 통학·상담이 가능한 인증 추천
            학원입니다.
          </span>
        </p>
      </div>

      <PremiumAcademyGrid
        academies={academies}
        premiumTitle="인근 지역 인증 추천 학원"
        premiumBadge="인근 인증 추천"
      />
    </section>
  );
}
