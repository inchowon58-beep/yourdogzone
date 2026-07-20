import Link from "next/link";
import {
  Camera,
  ClipboardList,
  CreditCard,
  HandCoins,
  MapPin,
  MousePointerClick,
  Truck,
} from "lucide-react";
import { CareIntakeApplyButton } from "@/components/care-matching/CareIntakeApplyButton";
import { CareMatchingOpenList } from "@/components/care-matching/CareMatchingOpenList";

const FLOW = [
  {
    step: 1,
    title: "입소 정보 등록",
    body: "강아지 사진·나이·건강 상태 등 파양·입소에 필요한 정보를 올립니다. (책임 접수비 5만 원)",
    icon: ClipboardList,
  },
  {
    step: 2,
    title: "전국 보호소 분담금 제안",
    body: "입소 가능한 사설보호소들이 안심 돌봄 분담금을 각각 제안합니다.",
    icon: HandCoins,
  },
  {
    step: 3,
    title: "보호소 선택·매칭",
    body: "가능한 분담금·시설을 비교한 뒤, 원하는 보호소를 골라 매칭합니다.",
    icon: MousePointerClick,
  },
  {
    step: 4,
    title: "보호소 입소비용 납부",
    body: "매칭된 보호소의 안심 돌봄 분담금(입소비용)을 납부하면 입소 절차가 확정됩니다.",
    icon: CreditCard,
  },
] as const;

const INTAKE_OPTIONS = [
  {
    title: "유아독존 안심 딜리버리",
    body: "입소비용 납부 확인 후 안심 딜리버리로 보호소 입소. 입소 뒤 아이 사진을 고객에게 전송합니다.",
    icon: Truck,
  },
  {
    title: "직접 방문 입소",
    body: "고객이 보호소를 직접 방문해 확인하고 입소할 수도 있습니다.",
    icon: MapPin,
  },
] as const;

export function CareMatchingSection() {
  return (
    <section
      aria-labelledby="care-matching-heading"
      className="w-full min-w-0 rounded-3xl bg-[#F3F4F6] px-3 py-12 sm:px-5 sm:py-16 md:px-6 md:py-20"
    >
      <div className="mx-auto w-full max-w-none">
        <div className="mx-auto w-full">
          <p className="text-center text-sm font-bold tracking-[0.12em] text-primary sm:text-base">
            사설보호소 입소비, 왜 이렇게 다를까?
          </p>

          <div className="mt-6 grid grid-cols-1 items-stretch gap-3 sm:mt-8 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-4">
            <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-white px-5 py-6 text-center shadow-[var(--card-shadow)] sm:px-6 sm:py-8">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-400 sm:text-sm">
                흔히 듣는 입소 견적
              </p>
              <p className="mt-3 text-3xl font-black tracking-tight text-red-600/90 line-through decoration-red-300 decoration-2 sm:text-4xl md:text-5xl">
                2,000만 원
              </p>
              <p className="mt-2 text-sm text-muted sm:text-base">
                “평생 케어” 명목의 일방적 고액
              </p>
            </div>

            <div
              className="flex items-center justify-center py-1 sm:px-1"
              aria-hidden
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-black text-foreground shadow-sm ring-1 ring-gray-200">
                VS
              </span>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/80 px-5 py-6 text-center shadow-[var(--card-shadow)] sm:px-6 sm:py-8">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 sm:text-sm">
                투명 매칭으로 나온 제안
              </p>
              <p className="mt-3 text-3xl font-black tracking-tight text-emerald-700 sm:text-4xl md:text-5xl">
                20만 원~
              </p>
              <p className="mt-2 text-sm text-emerald-800/80 sm:text-base">
                시설·상황에 맞춘 현실 분담금
              </p>
            </div>
          </div>

          <p className="mt-4 text-center text-sm leading-relaxed text-muted sm:text-base">
            ※ 예시 수치입니다. 견종·건강·지역에 따라 제안 금액은 달라질 수
            있습니다.
          </p>
        </div>

        <div className="mx-auto mt-10 w-full text-center sm:mt-12">
          <h2
            id="care-matching-heading"
            className="text-3xl font-black tracking-tight text-foreground sm:text-4xl md:text-[2.5rem] md:leading-tight"
          >
            같은 아이인데,
            <br className="sm:hidden" />{" "}
            <span className="text-primary">천 만 원 단위</span>로 갈립니다
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-muted sm:text-lg">
            이제 보호소가 부르는 대로 내지 마세요. 여러 곳의{" "}
            <strong className="font-semibold text-foreground">
              안심 돌봄 견적
            </strong>
            을 한눈에 비교하고,{" "}
            <strong className="font-semibold text-foreground">직접 결정</strong>
            하세요.
          </p>
        </div>

        <div className="mx-auto mt-10 w-full sm:mt-12">
          <div className="rounded-2xl border border-primary/20 bg-white px-6 py-8 text-center shadow-[var(--card-shadow)] sm:px-12 sm:py-11">
            <p className="text-3xl font-black tracking-tight text-foreground sm:text-4xl md:text-5xl md:leading-tight">
              합리적인 비용에{" "}
              <span className="text-primary">입소</span>
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg md:text-xl md:leading-relaxed">
              음지에 있던{" "}
              <strong className="font-bold text-foreground">
                터무니없는 입소비용
              </strong>
              을, 시스템을 통해{" "}
              <strong className="font-bold text-primary">양지</strong>에서
              합리적인 비용으로 해결할 수 있게 합니다.
            </p>
          </div>
        </div>

        <div className="mt-10 w-full sm:mt-12">
          <p className="mb-5 text-center text-base font-bold text-foreground sm:text-lg">
            이용 방법 · 이렇게 진행됩니다
          </p>

          <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
            {FLOW.map(({ step, title, body, icon: Icon }) => (
              <li
                key={step}
                className="relative flex gap-4 rounded-2xl border border-white/80 bg-white p-5 shadow-[var(--card-shadow)] sm:p-6"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-base font-black text-white">
                  {step}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2">
                    <Icon
                      className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                      aria-hidden
                    />
                    <h3 className="text-base font-bold tracking-tight text-foreground sm:text-[17px]">
                      {title}
                    </h3>
                  </div>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted sm:text-base">
                    {body}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-3 rounded-2xl border border-white/80 bg-white p-5 shadow-[var(--card-shadow)] sm:p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-base font-black text-white">
                5
              </span>
              <div>
                <h3 className="text-base font-bold tracking-tight text-foreground sm:text-[17px]">
                  납부 완료 후 입소
                </h3>
                <p className="mt-0.5 text-[15px] text-muted sm:text-base">
                  입소비용 납부가 확인되면, 아래 중 편한 방법으로 보호소에
                  입소합니다.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {INTAKE_OPTIONS.map(({ title, body, icon: Icon }) => (
                <div
                  key={title}
                  className="rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-4"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <p className="text-[15px] font-bold text-foreground sm:text-base">
                      {title}
                    </p>
                  </div>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted sm:text-base">
                    {body}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <Camera className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="text-[15px] font-bold text-emerald-900 sm:text-base">
                  입소 후 사진 전송
                </p>
                <p className="mt-1 text-[15px] leading-relaxed text-emerald-900/75 sm:text-base">
                  안심 딜리버리로 입소한 경우, 보호소 도착·입소 사진을 고객에게
                  보내 안심할 수 있게 합니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:mt-12 sm:flex-row sm:items-center">
          <CareIntakeApplyButton className="inline-flex h-14 items-center justify-center gap-1.5 rounded-xl bg-primary px-8 text-base font-semibold text-white transition-colors hover:bg-primary-hover sm:min-w-[16rem] sm:text-[17px]" />
          <Link
            href="/care-matching/my"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-gray-300 bg-white px-6 text-base font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary sm:min-w-[15rem]"
          >
            나의 안심입소 신청내역
          </Link>
          <Link
            href="/care-matching"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-gray-300 bg-white px-6 text-base font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary sm:min-w-[15rem]"
          >
            왜 금액이 이렇게 다른지 보기
          </Link>
        </div>

        <div className="mx-auto mt-10 w-full sm:mt-12">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-foreground sm:text-2xl">
                진행 중인 안심입소 매칭
              </h3>
            </div>
            <Link
              href="/care-matching/partner"
              className="text-[15px] font-semibold text-primary hover:underline sm:text-base"
            >
              보호소 파트너 가입 →
            </Link>
          </div>
          <CareMatchingOpenList limit={5} />
        </div>
      </div>
    </section>
  );
}
