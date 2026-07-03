import { PremiumAcademyGrid } from "@/components/academy/PremiumAcademyGrid";
import type { Academy } from "@/lib/types/academy";
import { Info } from "lucide-react";

type Props = {
  label: string;
  academies: Academy[];
  /** 전국 인증추천 풀 폴백 여부 */
  isPoolFallback?: boolean;
  entityLabel?: string;
  servicePath?: string;
};

export function NearbyPremiumAcademyFallback({
  label,
  academies,
  isPoolFallback = false,
  entityLabel = "학원",
  servicePath = "/services/academy",
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
                해당 지역에 등록된 인증 추천 {entityLabel}이 없어, 유아독존{" "}
                <strong>인증 추천 {entityLabel}</strong> 중 방문·상담 참고가 가능한
                곳을 안내합니다. <strong>{label}</strong>에서 이용 가능
                여부는 직접 확인하세요.
              </>
            ) : (
              <>
                해당지역 추천 {entityLabel}이 없어 인근지역 추천 정보가 노출됩니다.{" "}
                <strong>{label}</strong> 인근에서 방문·상담이 가능한 인증 추천
                {entityLabel}입니다.
              </>
            )}
          </span>
        </p>
      </div>

      <PremiumAcademyGrid
        academies={academies}
        servicePath={servicePath}
        premiumTitle={
          isPoolFallback
            ? `인증 추천 ${entityLabel} (방문·상담 참고)`
            : `인근 지역 인증 추천 ${entityLabel}`
        }
        premiumBadge={isPoolFallback ? "인증 추천" : "인근 인증 추천"}
      />
    </section>
  );
}
