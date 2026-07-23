import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  HeartHandshake,
  Home,
  MessageCircle,
  Search,
  ShieldAlert,
  Stethoscope,
  Users,
} from "lucide-react";
import { sampleStableRandom } from "@/lib/utils/random-sample";

const SITUATIONS = [
  "군입대",
  "이민·해외 이주",
  "임신·출산",
  "보호자 건강 악화",
  "보호자 신변 이상",
  "이혼·가족 변화",
  "주거 환경 변화(반려동물 불가)",
  "경제 상황의 급변",
  "장기 입원·요양",
  "돌봄 공백이 길어지는 경우",
] as const;

const FLOW = [
  {
    step: 1,
    title: "상담",
    body: "아이 나이·건강·성격·생활 습관을 정리해 상담합니다. 유기보다 먼저 보호소·입소 가능 여부를 확인하세요.",
    icon: MessageCircle,
  },
  {
    step: 2,
    title: "아이 상태 체크",
    body: "접종·중성화·최근 건강 상태를 확인합니다. 솔직한 정보가 새 가족 매칭에 가장 중요합니다.",
    icon: Stethoscope,
  },
  {
    step: 3,
    title: "보호소 입소",
    body: "비용·보호 환경·운영 방식을 확인한 뒤 입소합니다. 사설보호소는 보호·의료·케어를 위한 입소비용이 발생합니다.",
    icon: Home,
  },
  {
    step: 4,
    title: "새로운 가족 찾기",
    body: "공고·상담을 통해 아이에게 맞는 가정을 연결합니다. 파양은 끝이 아니라 새 시작이 될 수 있습니다.",
    icon: Users,
  },
] as const;

type Faq = { question: string; answer: string };

type Props = {
  label: string;
  pageKeyword: string;
  seedKey: string;
  faqItems?: Faq[];
  coverImageUrl?: string | null;
};

export function ShelterRegionalTrustGuide({
  label,
  pageKeyword,
  seedKey,
  faqItems = [],
  coverImageUrl,
}: Props) {
  const situations = sampleStableRandom(
    [...SITUATIONS],
    4,
    `${seedKey}-situations`
  );

  return (
    <section
      aria-labelledby="shelter-seo-heading"
      className="mb-12 w-full min-w-0 overflow-hidden rounded-3xl bg-[#F3F4F6] px-3 py-10 sm:px-5 sm:py-12 md:px-6 md:py-14"
    >
      <div className="mx-auto w-full max-w-none">
        <p className="text-center text-sm font-bold tracking-[0.12em] text-primary sm:text-base">
          {pageKeyword} 가이드
        </p>
        <h2
          id="shelter-seo-heading"
          className="mt-3 text-center text-2xl font-black tracking-tight text-foreground sm:text-3xl md:text-4xl"
        >
          강아지파양(입소),{" "}
          <span className="text-primary">꼭 알고 선택하세요</span>
        </h2>
        <p className="mx-auto mt-4 max-w-3xl text-center text-base leading-relaxed text-muted sm:text-lg">
          {label}에서 강아지파양·무료분양을 알아볼 때, 업체를 믿기 전에 먼저
          확인해야 할 핵심만 가독성 있게 정리했습니다.
        </p>

        {coverImageUrl ? (
          <div className="mx-auto mt-8 max-w-4xl overflow-hidden rounded-2xl border border-white/80 bg-white shadow-[var(--card-shadow)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverImageUrl}
              alt={`${pageKeyword} 안내 이미지`}
              className="aspect-[16/9] w-full object-cover"
              loading="lazy"
            />
          </div>
        ) : null}

        <div className="mx-auto mt-10 w-full sm:mt-12">
          <p className="text-center text-base font-bold text-foreground sm:text-lg">
            이런 상황이라면 고민만 하지 말고 상담해 보세요
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {situations.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/80 bg-white px-4 py-5 text-center shadow-[var(--card-shadow)]"
              >
                <p className="text-[15px] font-bold text-foreground sm:text-base">
                  {item}
                </p>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-4 max-w-3xl text-center text-[15px] leading-relaxed text-muted sm:text-base">
            어쩔 수 없는 상황에서의 강아지파양은 나쁜 일이 아닙니다. 유기하지
            않고 아이에게{" "}
            <strong className="font-semibold text-foreground">
              새로운 가정
            </strong>
            을 찾아주는 오히려 바람직한 선택일 수 있습니다.
          </p>
        </div>

        <div className="mx-auto mt-10 w-full sm:mt-12">
          <p className="text-center text-sm font-bold tracking-[0.12em] text-red-500 sm:text-base">
            사설보호소 입소비, 왜 이렇게 다를까?
          </p>
          <div className="mt-6 grid grid-cols-1 items-stretch gap-3 sm:mt-8 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-4">
            <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-white px-5 py-6 text-center shadow-[var(--card-shadow)] sm:px-6 sm:py-8">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-400 sm:text-sm">
                터무니없이 높은 견적
              </p>
              <p className="mt-3 text-3xl font-black tracking-tight text-red-600/90 line-through decoration-red-300 decoration-2 sm:text-4xl md:text-5xl">
                수천만 원
              </p>
              <p className="mt-2 text-sm text-muted sm:text-base">
                설명 없이 공포를 키우는 일방적 고액
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

            <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/80 px-5 py-6 text-center shadow-[var(--card-shadow)] sm:px-6 sm:py-8">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 sm:text-sm">
                지나치게 저렴한 견적
              </p>
              <p className="mt-3 text-3xl font-black tracking-tight text-amber-700 sm:text-4xl md:text-5xl">
                과소 비용?
              </p>
              <p className="mt-2 text-sm text-amber-900/80 sm:text-base">
                포함 항목·보호 환경이 불투명할 수 있음
              </p>
            </div>
          </div>
          <p className="mt-4 text-center text-sm leading-relaxed text-muted sm:text-base">
            입소비용이{" "}
            <strong className="font-semibold text-foreground">
              너무나도 터무니없이 비싸거나
            </strong>
            , 반대로{" "}
            <strong className="font-semibold text-foreground">
              지나치게 저렴하다면
            </strong>{" "}
            한 번쯤 신중히 생각해 보세요.
          </p>
        </div>

        <div className="mx-auto mt-10 w-full sm:mt-12">
          <div className="rounded-2xl border border-red-100 bg-white px-6 py-8 shadow-[var(--card-shadow)] sm:px-10 sm:py-10">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <ShieldAlert className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <p className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
                  안 좋은 곳이 많습니다.{" "}
                  <span className="text-red-600">꼭 유의해서 선택하세요</span>
                </p>
                <p className="mt-3 text-base leading-relaxed text-muted sm:text-lg">
                  강아지파양으로 입소할 때는 최근 뉴스에서도 보도된 것처럼,
                  믿을 수 없는 운영을 하는 곳이 있을 수 있습니다. 비용만 보고
                  급하게 결정하지 말고, 보호 환경·비용 항목·상담 응대를
                  직접 확인한 뒤 선택해야 합니다.
                </p>
              </div>
            </div>
            <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                "비용 포함 항목을 투명하게 설명하는가",
                "보호 공간·위생·케어 방식을 확인할 수 있는가",
                "상담 응대가 신뢰할 수 있는가",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3.5 text-[15px] leading-relaxed text-foreground sm:text-base"
                >
                  <Search
                    className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                    aria-hidden
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mx-auto mt-10 grid grid-cols-1 gap-4 sm:mt-12 lg:grid-cols-2">
          <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-[var(--card-shadow)] sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <HeartHandshake className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
                강아지무료분양이란?
              </h3>
            </div>
            <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
              강아지무료분양은{" "}
              <strong className="font-bold text-foreground">
                유기견·유기묘
              </strong>
              를 뜻하는 것이 아닙니다. 가정에서 생활하던 아이들이 사정으로
              파양되어{" "}
              <strong className="font-bold text-foreground">
                새로운 가족을 찾고 있는 경우
              </strong>
              를 말하는 경우가 많습니다.
            </p>
          </div>

          <div className="rounded-2xl border border-primary/15 bg-white p-6 shadow-[var(--card-shadow)] sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
                사설보호소 입소비용
              </h3>
            </div>
            <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
              사설보호소는{" "}
              <strong className="font-bold text-foreground">
                입소 시 비용이 발생
              </strong>
              합니다. 보호·의료·케어를 위한 비용이며, 어떤 보호소든 기본
              운영비가 들어갈 수 있습니다. 중요한 것은 “싸다/비싸다”보다{" "}
              <strong className="font-bold text-primary">
                무엇을 위한 비용인지
              </strong>
              를 확인할 수 있는가입니다.
            </p>
          </div>
        </div>

        <div className="mx-auto mt-10 w-full sm:mt-12">
          <div className="rounded-2xl border border-amber-100 bg-amber-50/70 px-6 py-8 sm:px-10 sm:py-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
                <AlertTriangle className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <p className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
                  시에서 운영하는 유기견보호소와는 다릅니다
                </p>
                <p className="mt-3 text-base leading-relaxed text-muted sm:text-lg">
                  시·군 유기견보호소는 개인적인 사정의 파양을 받아주는 곳이
                  아니라, 실제로 유기되었거나 길을 잃은 아이들을 보호하는
                  경우가 많습니다. 일정 기간 새 주인이 나타나지 않으면{" "}
                  <strong className="font-bold text-foreground">
                    안락사
                  </strong>
                  가 이뤄질 수 있습니다. 이미 주인이 있는 아이의 경우, 이런
                  유기견보호소 입소·파양은 사실상 불가능하다고 보는 것이
                  맞습니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 w-full sm:mt-12">
          <p className="mb-5 text-center text-base font-bold text-foreground sm:text-lg">
            강아지파양 방법 · 이렇게 진행됩니다
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
        </div>

        <div className="mx-auto mt-10 w-full sm:mt-12">
          <div className="rounded-2xl border border-primary/20 bg-white px-6 py-8 text-center shadow-[var(--card-shadow)] sm:px-12 sm:py-11">
            <p className="text-3xl font-black tracking-tight text-foreground sm:text-4xl md:text-5xl md:leading-tight">
              유기하지 말고,{" "}
              <span className="text-primary">새 가족을</span>
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg md:text-xl md:leading-relaxed">
              {label}에서 강아지파양을 고민 중이라면, 믿을 수 있는 상담부터
              시작하세요. 투명한 비용·보호 환경·절차를 확인한 뒤 전화로
              문의하는 것이 가장 안전합니다.
            </p>
            <div className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-3 text-[15px] text-foreground sm:text-base">
              {[
                "파양은 유기와 다릅니다",
                "무료분양은 가정견이 새 가족을 찾는 과정",
                "입소비용은 꼭 항목 확인",
              ].map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50/80 px-3 py-1.5 font-semibold text-emerald-900"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {faqItems.length > 0 ? (
          <div className="mx-auto mt-10 w-full sm:mt-12">
            <p className="mb-5 text-center text-base font-bold text-foreground sm:text-lg">
              자주 묻는 질문
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {faqItems.map((item) => (
                <article
                  key={item.question}
                  className="rounded-2xl border border-white/80 bg-white p-5 shadow-[var(--card-shadow)] sm:p-6"
                >
                  <h3 className="text-base font-bold text-foreground sm:text-[17px]">
                    {item.question}
                  </h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted sm:text-base">
                    {item.answer}
                  </p>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
