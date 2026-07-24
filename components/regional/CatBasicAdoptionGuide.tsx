import {
  Building2,
  Cat,
  CheckCircle2,
  HeartHandshake,
  Home,
  MessageCircle,
  ShieldAlert,
  Stethoscope,
  Syringe,
  Wallet,
} from "lucide-react";
import { sampleStableRandom } from "@/lib/utils/random-sample";

type Faq = { question: string; answer: string };

type Props = {
  label: string;
  pageKeyword: string;
  seedKey: string;
  faqItems?: Faq[];
  coverImageUrl?: string | null;
  recommendedName?: string | null;
};

const HEADLINE_TAILS = [
  "처음이라면 이렇게 준비하세요",
  "비용·케어부터 정리해 보세요",
  "충동 분양 전에 꼭 읽으세요",
  "아파트·초보 가정 기준으로 확인하세요",
] as const;

const EASY_CATS = [
  "코리안숏헤어",
  "러시안블루",
  "아메리칸숏헤어",
  "브리티시숏헤어",
  "랙돌",
  "스코티시폴드(건강 확인 필수)",
] as const;

const APT_CATS = [
  "조용한 성향의 단모종",
  "실내 생활 적응이 빠른 아이",
  "그루밍 부담이 적은 단모",
  "활동량이 적당한 중·소형 묘",
  "합사·아이와의 궁합이 좋은 온순묘",
  "화장실 적응이 잘 되는 개체",
] as const;

const START_COST_ITEMS = [
  { title: "초기 용품", body: "화장실·모래·스크래처·이동장·식기·장난감" },
  { title: "사료·간식", body: "연령·체중에 맞는 사료와 물 환경" },
  { title: "병원·접종", body: "건강검진·예방접종·구충·중성화 상담" },
  { title: "안전 환경", body: "방충망·위험물 정리·독립 적응 공간" },
] as const;

const CARE_STEPS = [
  {
    title: "배변(화장실) 훈련",
    body: "대부분 본능적으로 화장실을 이용하지만, 위치·모래·청결이 중요합니다. 초기에 화장실을 찾기 쉬운 곳에 두고, 이동 직후에는 잠시 좁은 공간에서 적응시키는 편이 좋습니다.",
    icon: Home,
  },
  {
    title: "접종·건강 관리",
    body: "종합백신·광견병 등 접종 일정과 구충, 중성화 여부를 분양 전·후로 확인하세요. 인수 직후 동물병원 건강검진을 권장합니다.",
    icon: Syringe,
  },
  {
    title: "일상 케어",
    body: "스크래처·놀이 시간·정기 빗질·화장실 관리가 기본입니다. 실내묘는 자극이 부족하면 스트레스가 생길 수 있어 캣타워·숨숨집도 도움이 됩니다.",
    icon: HeartHandshake,
  },
  {
    title: "적응 기간",
    body: "처음 며칠은 독립된 방에서 천천히 공간을 넓히세요. 억지로 안기거나 손님을 많이 부르면 적응이 늦어질 수 있습니다.",
    icon: Cat,
  },
] as const;

const REVIEW_POOL = [
  {
    name: "김*진",
    tag: "첫 반려묘",
    text: "아파트라 걱정했는데, 성격 상담을 자세히 해주셔서 적응이 빨랐어요. 화장실도 금방 익숙해졌습니다.",
  },
  {
    name: "박*수",
    tag: "직장인",
    text: "접종 기록이랑 건강 상태를 투명하게 보여줘서 안심하고 분양받았어요. 사후 문의도 잘 받아주셨습니다.",
  },
  {
    name: "이*연",
    tag: "아이와 함께",
    text: "아이와 합사 가능한지 먼저 물어봐 주셔서 좋았어요. 온순한 아이로 매칭해 주셨습니다.",
  },
  {
    name: "최*호",
    tag: "비용 상담",
    text: "분양가만 보지 말고 초기 용품·병원비까지 설명해 주셔서 예산 계획이 수월했습니다.",
  },
  {
    name: "정*아",
    tag: "재방문",
    text: "환경이 깨끗하고 아이들이 활발했어요. 계약서 내용도 꼼꼼히 안내받았습니다.",
  },
  {
    name: "한*우",
    tag: "초보 집사",
    text: "배변·접종·적응 방법을 체크리스트로 주셔서 처음인데도 큰 실수 없이 키우고 있어요.",
  },
  {
    name: "윤*서",
    tag: "유기묘 입양",
    text: "무료분양이어도 진료비·책임비가 있을 수 있다는 설명을 미리 들어서 당황하지 않았습니다.",
  },
  {
    name: "오*림",
    tag: "장모 관심",
    text: "그루밍 부담을 미리 알려주셔서 단모 쪽으로 방향을 바꿨고, 결과가 만족스럽습니다.",
  },
] as const;

const DEFAULT_FAQS: Faq[] = [
  {
    question: "고양이 분양가격은 얼마인가요?",
    answer:
      "아이들의 퀄리티·혈통·건강 관리 수준에 따라 적게는 10만 원대부터 수백만 원 이상까지 달라질 수 있습니다. 단정된 ‘정가’보다 포함 항목과 사후관리를 확인하는 것이 중요합니다.",
  },
  {
    question: "유기묘보호소 무료분양은 정말 비용이 없나요?",
    answer:
      "분양비 자체가 무료인 경우도 있지만, 진료비·책임비·중성화·기본 검진 등으로 일부 비용이 발생할 수 있습니다. ‘완전 무비용’으로 단정하지 않는 편이 안전합니다.",
  },
  {
    question: "처음 키울 때 비용은 얼마나 보나요?",
    answer:
      "초기에는 용품(화장실·모래·스크래처·이동장), 사료, 병원(검진·접종) 비용이 함께 들어갑니다. 분양가와 별도로 초기 정착 비용을 여유 있게 준비하세요.",
  },
  {
    question: "고양이 배변훈련은 어떻게 하나요?",
    answer:
      "대부분 본능적으로 화장실을 이용합니다. 청결한 화장실·적절한 모래·찾기 쉬운 위치가 핵심이며, 이사·분양 직후에는 좁은 공간에서 적응을 돕는 것이 좋습니다.",
  },
  {
    question: "접종은 필수인가요?",
    answer:
      "예방접종·구충·건강검진은 기본으로 확인하는 것이 좋습니다. 분양 전 기록과 다음 접종 일정을 받아 두고, 인수 후 병원에서 상태를 재확인하세요.",
  },
  {
    question: "어떤 업체에서 입양하면 좋을까요?",
    answer:
      "업체가 많아 선택이 어렵다면, 해당 페이지의 인증 추천업체 정보를 먼저 참고해 보세요. 환경·상담·계약 투명성을 기준으로 비교하는 것이 안전합니다.",
  },
];

export function CatBasicAdoptionGuide({
  label,
  pageKeyword,
  seedKey,
  faqItems = [],
  coverImageUrl,
  recommendedName,
}: Props) {
  const tail = sampleStableRandom([...HEADLINE_TAILS], 1, `${seedKey}-tail`)[0];
  const easy = sampleStableRandom([...EASY_CATS], 4, `${seedKey}-easy`);
  const apt = sampleStableRandom([...APT_CATS], 4, `${seedKey}-apt`);
  const reviews = sampleStableRandom([...REVIEW_POOL], 6, `${seedKey}-reviews`);
  const faqs =
    faqItems.length >= 4
      ? faqItems
      : sampleStableRandom(DEFAULT_FAQS, 6, `${seedKey}-faq`);

  return (
    <section
      aria-labelledby="cat-basic-seo-heading"
      className="mb-12 w-full min-w-0 overflow-hidden rounded-3xl bg-[#F3F4F6] px-3 py-10 sm:px-5 sm:py-12 md:px-6 md:py-14"
    >
      <div className="mx-auto w-full max-w-none">
        <p className="text-center text-sm font-bold tracking-[0.12em] text-primary sm:text-base">
          {pageKeyword} 가이드
        </p>
        <h2
          id="cat-basic-seo-heading"
          className="mt-3 text-center text-2xl font-black tracking-tight text-foreground sm:text-3xl md:text-4xl md:leading-tight"
        >
          고양이 처음 키운다면,{" "}
          <span className="text-primary">{tail}</span>
        </h2>
        <p className="mx-auto mt-4 max-w-3xl text-center text-base leading-relaxed text-muted sm:text-lg">
          {label}에서 고양이분양을 알아볼 때, 키우기 쉬운 고양이·아파트 환경·초기
          비용·배변·접종까지 한눈에 정리했습니다. 충동 분양보다{" "}
          <strong className="font-semibold text-foreground">
            준비와 신뢰할 수 있는 상담
          </strong>
          이 먼저입니다.
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

        <div className="mx-auto mt-10 grid grid-cols-1 gap-4 sm:mt-12 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/80 bg-white p-6 shadow-[var(--card-shadow)] sm:p-8">
            <p className="text-sm font-bold tracking-[0.08em] text-primary">
              키우기 쉬운 고양이
            </p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              초보 집사가 고르기 쉬운 타입
            </h3>
            <p className="mt-3 text-base leading-relaxed text-muted sm:text-lg">
              ‘쉽다’는 절대 기준은 아니지만, 성격이 온순하고 실내 적응이 빠른
              아이들이 첫 반려묘로 많이 선택됩니다.
            </p>
            <ul className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {easy.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-3 text-[15px] font-semibold text-foreground sm:text-base"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-white/80 bg-white p-6 shadow-[var(--card-shadow)] sm:p-8">
            <p className="text-sm font-bold tracking-[0.08em] text-amber-700">
              아파트에서 키우기 좋은 고양이
            </p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              층간·소음·공간을 고려하세요
            </h3>
            <p className="mt-3 text-base leading-relaxed text-muted sm:text-lg">
              아파트는 활동량·울음·스크래치 관리가 중요합니다. 개체 차는 크니
              분양 전 성격을 꼭 확인하세요.
            </p>
            <ul className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {apt.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 rounded-xl bg-amber-50/80 px-3 py-3 text-[15px] font-semibold text-foreground sm:text-base"
                >
                  <Home className="h-4 w-4 shrink-0 text-amber-700" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mx-auto mt-10 w-full sm:mt-12">
          <p className="text-center text-sm font-bold tracking-[0.12em] text-primary sm:text-base">
            고양이 처음 키우는데 드는 비용
          </p>
          <h3 className="mt-3 text-center text-2xl font-black tracking-tight text-foreground sm:text-3xl md:text-4xl">
            분양가 + 초기 정착비로 보세요
          </h3>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {START_COST_ITEMS.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/80 bg-white px-4 py-5 text-center shadow-[var(--card-shadow)] sm:px-5 sm:py-6"
              >
                <p className="text-base font-black text-foreground sm:text-lg">
                  {item.title}
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-muted sm:text-sm">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-10 w-full sm:mt-12">
          <div className="rounded-2xl border border-primary/15 bg-white px-6 py-8 shadow-[var(--card-shadow)] sm:px-10 sm:py-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Wallet className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <h3 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                  고양이 분양가격 · 비용 안내
                </h3>
                <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg md:text-xl md:leading-relaxed">
                  분양가는 아이들의{" "}
                  <strong className="font-bold text-foreground">
                    퀄리티·혈통·건강관리
                  </strong>
                  에 따라 적게는{" "}
                  <strong className="font-bold text-primary">10만 원대</strong>
                  부터{" "}
                  <strong className="font-bold text-primary">
                    수백만 원 이상
                  </strong>
                  까지 달라질 수 있습니다. 정확한 금액을 단정하기보다, 포함
                  항목과 사후관리를 확인하세요.
                </p>
                <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
                  유기묘보호소를 통한 무료분양도 가능하지만, 입양한다고 해서
                  비용이 전혀 발생하지 않는 것은 아닙니다.{" "}
                  <strong className="font-semibold text-foreground">
                    진료비·책임비
                  </strong>
                  등으로 일부 비용이 발생할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 w-full sm:mt-12">
          <p className="mb-5 text-center text-base font-bold text-foreground sm:text-lg">
            고양이 키우는 방법 · 배변 · 접종
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:gap-4">
            {CARE_STEPS.map(({ title, body, icon: Icon }) => (
              <article
                key={title}
                className="rounded-2xl border border-white/80 bg-white p-5 shadow-[var(--card-shadow)] sm:p-6"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="text-lg font-black tracking-tight text-foreground sm:text-xl">
                    {title}
                  </h3>
                </div>
                <p className="mt-3 text-[15px] leading-relaxed text-muted sm:text-base">
                  {body}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-10 w-full sm:mt-12">
          <div className="rounded-2xl border border-red-100 bg-white px-6 py-8 shadow-[var(--card-shadow)] sm:px-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <ShieldAlert className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <p className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
                  어떤 업체에서 입양하면 좋을까?
                </p>
                <p className="mt-3 text-base leading-relaxed text-muted sm:text-lg">
                  업체가 너무 많아 어디로 가야 할지 고민이라면,{" "}
                  <strong className="font-bold text-foreground">
                    이 페이지의 추천업체 정보
                  </strong>
                  를 먼저 활용해 보세요
                  {recommendedName ? (
                    <>
                      {" "}
                      (예:{" "}
                      <span className="font-semibold text-primary">
                        {recommendedName}
                      </span>
                      )
                    </>
                  ) : null}
                  . 사육 환경·상담·계약 투명성을 기준으로 비교하는 것이
                  안전합니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 w-full sm:mt-12">
          <p className="mb-5 text-center text-base font-bold text-foreground sm:text-lg">
            분양 후기
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r) => (
              <article
                key={`${r.name}-${r.tag}`}
                className="rounded-2xl border border-white/80 bg-white p-5 shadow-[var(--card-shadow)] sm:p-6"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-base font-bold text-foreground">{r.name}</p>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                    {r.tag}
                  </span>
                </div>
                <p className="mt-3 text-[15px] leading-relaxed text-muted sm:text-base">
                  “{r.text}”
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-10 w-full sm:mt-12">
          <div className="rounded-2xl border border-primary/20 bg-white px-6 py-8 text-center shadow-[var(--card-shadow)] sm:px-12 sm:py-11">
            <p className="text-3xl font-black tracking-tight text-foreground sm:text-4xl md:text-5xl md:leading-tight">
              평생 가족,{" "}
              <span className="text-primary">준비부터</span>
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg md:text-xl">
              {label} 고양이분양은 외형보다 건강·성격·초기 비용·사후관리를 함께
              보세요. 궁금한 점은 아래 인증 추천업체에 전화로 문의하는 것이 가장
              확실합니다.
            </p>
            <div className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-3 text-[15px] sm:text-base">
              {[
                "분양가는 퀄리티·혈통에 따라 다름",
                "무료분양도 일부 비용 가능",
                "배변·접종·적응이 핵심",
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

        <div className="mx-auto mt-10 w-full sm:mt-12">
          <p className="mb-5 text-center text-base font-bold text-foreground sm:text-lg">
            자주 묻는 질문
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {faqs.map((item) => (
              <article
                key={item.question}
                className="rounded-2xl border border-white/80 bg-white p-5 shadow-[var(--card-shadow)] sm:p-6"
              >
                <div className="flex items-start gap-2">
                  <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <h3 className="text-base font-bold text-foreground sm:text-[17px]">
                    {item.question}
                  </h3>
                </div>
                <p className="mt-2 text-[15px] leading-relaxed text-muted sm:text-base">
                  {item.answer}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-10 hidden items-center justify-center gap-2 text-sm text-muted sm:flex">
          <Building2 className="h-4 w-4" />
          <Stethoscope className="h-4 w-4" />
          <span>{label} 고양이분양 · 건강·계약·케어를 함께 확인하세요</span>
        </div>
      </div>
    </section>
  );
}
