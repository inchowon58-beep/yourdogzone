import { PremiumAcademyGrid } from "@/components/academy/PremiumAcademyGrid";
import type { Academy } from "@/lib/types/academy";
import { Info } from "lucide-react";

type Props = {
  label: string;
  academies: Academy[];
  /** 전국 인증추천 풀 폴백 여부 */
  isPoolFallback?: boolean;
};

export function NearbyPremiumAcademyFallback({
  label,
  academies,
  isPoolFallback = false,
}: Props) {
  if (academies.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3.5 sm:px-5">
        <p className="flex items-start gap-2 text-sm leading-relaxed text-amber-950">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            {isPoolFallback ? (
              <>
                해당 지역에 등록된 인증 추천 학원이 없어, 유아독존{" "}
                <strong>인증 추천 학원</strong> 중 통학·상담 참고가 가능한
                곳을 안내합니다. <strong>{label}</strong>에서 방문·통학 가능
                여부는 학원에 직접 확인하세요.
              </>
            ) : (
              <>
                해당지역 추천학원이 없어 인근지역추천학원 정보가 노출됩니다.{" "}
                <strong>{label}</strong> 인근에서 통학·상담이 가능한 인증 추천
                학원입니다.
              </>
            )}
          </span>
        </p>
      </div>

      <PremiumAcademyGrid
        academies={academies}
        premiumTitle={
          isPoolFallback
            ? "인증 추천 학원 (통학·상담 참고)"
            : "인근 지역 인증 추천 학원"
        }
        premiumBadge={isPoolFallback ? "인증 추천" : "인근 인증 추천"}
      />
    </section>
  );
}
