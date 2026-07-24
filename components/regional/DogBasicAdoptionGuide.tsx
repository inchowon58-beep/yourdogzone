import {
  Building2,
  CheckCircle2,
  Dog,
  HeartHandshake,
  Home,
  MessageCircle,
  ShieldAlert,
  Stethoscope,
  Syringe,
  Wallet,
} from "lucide-react";
import {
  pickCount,
  pickGuideSections,
} from "@/lib/seo/adoption-guide-vary";
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

type SectionId =
  | "easy"
  | "apt"
  | "startCost"
  | "price"
  | "care"
  | "vendor"
  | "reviews"
  | "cta";

const HEADLINE_TAILS = [
  "처음이라면 이렇게 준비하세요",
  "비용·훈련부터 정리해 보세요",
  "충동 분양 전에 꼭 읽으세요",
  "아파트·초보 가정 기준으로 확인하세요",
] as const;

const EASY_DOGS = [
  "말티즈",
  "푸들(토이·미니)",
  "포메라니안",
  "비숑프리제",
  "시츄",
  "코커스패니얼",
  "골든리트리버(활동량 확인)",
  "믹스견(성격 확인)",
] as const;

const APT_DOGS = [
  "소형견 · 실내 적응이 빠른 아이",
  "분리불안 케어가 가능한 온순견",
  "산책량이 적당한 타입",
  "짖음·하울링이 적은 개체",
  "미용·그루밍 계획을 세울 수 있는 장모/곱슬",
  "아이·노인과 합사가 무난한 성격",
] as const;

const START_COST_ITEMS = [
  { title: "초기 용품", body: "목줄·하네스·이동장·식기·배변패드·장난감" },
  { title: "사료·간식", body: "연령·체중에 맞는 사료와 급수" },
  { title: "병원·접종", body: "건강검진·예방접종·구충·중성화 상담" },
  { title: "훈련·케어", body: "산책·배변·사회화·미용(견종별)" },
] as const;

const CARE_STEPS = [
  {
    title: "배변 훈련",
    body: "패드·지정 장소·칭찬 타이밍이 중요합니다. 분양 직후 며칠은 루틴을 단순하게 유지하면 적응이 빨라집니다.",
    icon: Home,
  },
  {
    title: "접종·건강 관리",
    body: "종합백신·코로나·켄넬코프·광견병 등 일정과 구충을 확인하세요. 인수 직후 동물병원 건강검진을 권장합니다.",
    icon: Syringe,
  },
  {
    title: "산책·사회화",
    body: "초기는 짧게·자주, 사람·소리·다른 강아지에 천천히 익숙해지게 하세요. 무리한 장거리 산책은 피합니다.",
    icon: HeartHandshake,
  },
  {
    title: "분리불안·적응",
    body: "혼자 있는 연습을 짧게 시작하세요. 과도한 방치나 과보호 모두 적응을 어렵게 만들 수 있습니다.",
    icon: Dog,
  },
] as const;

const REVIEW_POOL = [
  {
    name: "김*현",
    tag: "첫 반려견",
    text: "아파트라 소음이 걱정됐는데, 성격 상담을 자세히 해주셔서 적응이 수월했어요. 배변도 생각보다 빨랐습니다.",
  },
  {
    name: "박*민",
    tag: "직장인",
    text: "접종 기록이 깔끔하고 계약 설명이 명확했어요. 사후 문의도 잘 받아주셨습니다.",
  },
  {
    name: "이*정",
    tag: "아이와 함께",
    text: "아이와 합사 가능한지 먼저 확인해 주셔서 좋았습니다. 온순한 아이로 매칭해 주셨어요.",
  },
  {
    name: "최*우",
    tag: "비용 상담",
    text: "분양가만 보지 말고 초기 용품·병원비까지 안내해 주셔서 예산이 명확해졌습니다.",
  },
  {
    name: "정*아",
    tag: "재방문",
    text: "환경이 깨끗하고 아이들이 활발했어요. 건강·성격 설명을 솔직하게 해주셨습니다.",
  },
  {
    name: "한*준",
    tag: "초보 보호자",
    text: "배변·접종·산책 루틴을 체크리스트로 주셔서 처음인데도 큰 실수 없이 키우고 있어요.",
  },
  {
    name: "윤*서",
    tag: "유기견 입양",
    text: "무료분양이어도 진료비·책임비가 있을 수 있다는 설명을 미리 들어서 당황하지 않았습니다.",
  },
  {
    name: "오*림",
    tag: "소형견",
    text: "활동량과 미용 주기를 미리 알려주셔서 생활 패턴에 맞는 아이를 고를 수 있었습니다.",
  },
] as const;

function buildDefaultFaqs(
  label: string,
  pageKeyword: string
): Faq[] {
  return [
    {
      question: `${pageKeyword} 분양가격은 얼마인가요?`,
      answer:
        "아이들의 퀄리티·혈통·건강 관리 수준에 따라 적게는 10만 원대부터 수백만 원 이상까지 달라질 수 있습니다. 포함 항목과 사후관리를 확인하세요.",
    },
    {
      question: "유기견보호소 무료분양은 비용이 전혀 없나요?",
      answer:
        "분양비가 무료인 경우도 있지만 진료비·책임비·기본 검진 등으로 일부 비용이 발생할 수 있습니다.",
    },
    {
      question: `${label}에서 강아지 처음 키울 때 비용은?`,
      answer:
        "용품·사료·병원(검진·접종)·훈련 관련 초기 정착비를 분양가와 별도로 준비하는 것이 좋습니다.",
    },
    {
      question: "강아지 배변훈련은 어떻게 하나요?",
      answer:
        "지정 장소·패드·칭찬 타이밍이 핵심입니다. 분양 직후 루틴을 단순하게 유지하면 적응에 도움이 됩니다.",
    },
    {
      question: "접종은 필수인가요?",
      answer:
        "예방접종·구충·건강검진 기록을 분양 전 확인하고, 인수 후 병원에서 상태를 재확인하세요.",
    },
    {
      question: `${pageKeyword}, 어떤 업체에서 입양하면 좋을까요?`,
      answer:
        "업체가 많아 선택이 어렵다면 이 페이지의 인증 추천업체 정보를 먼저 참고하세요. 환경·상담·계약 투명성이 중요합니다.",
    },
    {
      question: "아파트에서 키우기 좋은 강아지가 있나요?",
      answer:
        "소형견·실내 적응이 빠른 아이, 짖음이 적은 개체 등이 많이 선택됩니다. 개체 차가 크니 성격을 꼭 확인하세요.",
    },
    {
      question: "키우기 쉬운 강아지는 어떤 타입인가요?",
      answer:
        "온순하고 훈련 반응이 좋은 아이들이 초보 보호자에게 상대적으로 수월한 편입니다. 절대 기준은 없으니 상담이 중요합니다.",
    },
  ];
}

export function DogBasicAdoptionGuide({
  label,
  pageKeyword,
  seedKey,
  faqItems = [],
  coverImageUrl,
  recommendedName,
}: Props) {
  const sections = pickGuideSections(
    [
      "easy",
      "apt",
      "startCost",
      "price",
      "care",
      "vendor",
      "reviews",
      "cta",
    ] as const,
    seedKey,
    { min: 3, max: 5, always: ["price", "vendor"] }
  );

  const tail = sampleStableRandom([...HEADLINE_TAILS], 1, `${seedKey}-tail`)[0];
  const easy = sampleStableRandom(
    [...EASY_DOGS],
    pickCount(seedKey, 3, 5, "easy"),
    `${seedKey}-easy`
  );
  const apt = sampleStableRandom(
    [...APT_DOGS],
    pickCount(seedKey, 3, 5, "apt"),
    `${seedKey}-apt`
  );
  const costItems = sampleStableRandom(
    [...START_COST_ITEMS],
    pickCount(seedKey, 3, 4, "cost"),
    `${seedKey}-cost`
  );
  const care = sampleStableRandom(
    [...CARE_STEPS],
    pickCount(seedKey, 2, 4, "care"),
    `${seedKey}-care`
  );
  const reviews = sampleStableRandom(
    [...REVIEW_POOL],
    pickCount(seedKey, 4, 6, "reviews"),
    `${seedKey}-reviews`
  );
  const faqPool =
    faqItems.length >= 3 ? faqItems : buildDefaultFaqs(label, pageKeyword);
  const faqs = sampleStableRandom(
    faqPool,
    pickCount(seedKey, 4, 6, "faq"),
    `${seedKey}-faq`
  );

  const show = (id: SectionId) => sections.has(id);

  return (
    <section
      aria-labelledby="dog-basic-seo-heading"
      className="mb-12 w-full min-w-0 overflow-hidden rounded-3xl bg-[#F3F4F6] px-3 py-10 sm:px-5 sm:py-12 md:px-6 md:py-14"
    >
      <div className="mx-auto w-full max-w-none">
        <p className="text-center text-sm font-bold tracking-[0.12em] text-primary sm:text-base">
          {pageKeyword}
        </p>
        <h2
          id="dog-basic-seo-heading"
          className="mt-3 text-center text-2xl font-black tracking-tight text-foreground sm:text-3xl md:text-4xl md:leading-tight"
        >
          {pageKeyword},{" "}
          <span className="text-primary">{tail}</span>
        </h2>
        <p className="mx-auto mt-4 max-w-3xl text-center text-base leading-relaxed text-muted sm:text-lg">
          {label}에서{" "}
          <strong className="font-semibold text-foreground">{pageKeyword}</strong>을(를)
          찾을 때, 키우기 쉬운 강아지·아파트 환경·초기 비용·배변·접종을 중심으로
          정리했습니다. 검색 의와 실제 상담 포인트를 함께 확인하세요.
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

        {(show("easy") || show("apt")) && (
          <div className="mx-auto mt-10 grid grid-cols-1 gap-4 sm:mt-12 lg:grid-cols-2">
            {show("easy") ? (
              <div className="rounded-2xl border border-white/80 bg-white p-6 shadow-[var(--card-shadow)] sm:p-8">
                <p className="text-sm font-bold tracking-[0.08em] text-primary">
                  키우기 쉬운 강아지
                </p>
                <h3 className="mt-2 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                  {pageKeyword} · 초보가 고르기 쉬운 타입
                </h3>
                <p className="mt-3 text-base leading-relaxed text-muted sm:text-lg">
                  ‘쉽다’는 절대 기준은 아닙니다. 온순함·훈련 반응·생활 패턴 맞는
                  아이를 상담으로 고르는 것이 중요합니다.
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
            ) : null}

            {show("apt") ? (
              <div className="rounded-2xl border border-white/80 bg-white p-6 shadow-[var(--card-shadow)] sm:p-8">
                <p className="text-sm font-bold tracking-[0.08em] text-amber-700">
                  아파트에서 키우기 좋은 강아지
                </p>
                <h3 className="mt-2 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                  층간·소음·산책량을 보세요
                </h3>
                <p className="mt-3 text-base leading-relaxed text-muted sm:text-lg">
                  {pageKeyword} 상담 시 짖음·활동량·분리불안 성향을 꼭
                  물어보세요.
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
            ) : null}
          </div>
        )}

        {show("startCost") ? (
          <div className="mx-auto mt-10 w-full sm:mt-12">
            <p className="text-center text-sm font-bold tracking-[0.12em] text-primary sm:text-base">
              {pageKeyword} · 처음 키울 때 비용
            </p>
            <h3 className="mt-3 text-center text-2xl font-black tracking-tight text-foreground sm:text-3xl md:text-4xl">
              분양가 + 초기 정착비로 보세요
            </h3>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {costItems.map((item) => (
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
        ) : null}

        {show("price") ? (
          <div className="mx-auto mt-10 w-full sm:mt-12">
            <div className="rounded-2xl border border-primary/15 bg-white px-6 py-8 shadow-[var(--card-shadow)] sm:px-10 sm:py-10">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Wallet className="h-6 w-6" aria-hidden />
                </span>
                <div>
                  <h3 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                    {pageKeyword} 분양가격 · 비용
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
                    까지 달라질 수 있습니다.
                  </p>
                  <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
                    유기견보호소 무료분양도 가능하지만,{" "}
                    <strong className="font-semibold text-foreground">
                      진료비·책임비
                    </strong>
                    등으로 일부 비용이 발생할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {show("care") ? (
          <div className="mx-auto mt-10 w-full sm:mt-12">
            <p className="mb-5 text-center text-base font-bold text-foreground sm:text-lg">
              {pageKeyword} · 키우는 방법 · 배변 · 접종
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:gap-4">
              {care.map(({ title, body, icon: Icon }) => (
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
        ) : null}

        {show("vendor") ? (
          <div className="mx-auto mt-10 w-full sm:mt-12">
            <div className="rounded-2xl border border-red-100 bg-white px-6 py-8 shadow-[var(--card-shadow)] sm:px-10">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                  <ShieldAlert className="h-6 w-6" aria-hidden />
                </span>
                <div>
                  <p className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
                    {pageKeyword}, 어떤 업체에서 입양하면 좋을까?
                  </p>
                  <p className="mt-3 text-base leading-relaxed text-muted sm:text-lg">
                    업체가 너무 많아 고민이라면{" "}
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
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {show("reviews") ? (
          <div className="mx-auto mt-10 w-full sm:mt-12">
            <p className="mb-5 text-center text-base font-bold text-foreground sm:text-lg">
              {pageKeyword} 분양 후기
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
        ) : null}

        {show("cta") ? (
          <div className="mx-auto mt-10 w-full sm:mt-12">
            <div className="rounded-2xl border border-primary/20 bg-white px-6 py-8 text-center shadow-[var(--card-shadow)] sm:px-12 sm:py-11">
              <p className="text-3xl font-black tracking-tight text-foreground sm:text-4xl md:text-5xl md:leading-tight">
                {pageKeyword},{" "}
                <span className="text-primary">신중하게</span>
              </p>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg md:text-xl">
                {label} 기준으로 건강·성격·초기 비용·사후관리를 함께 확인하세요.
              </p>
            </div>
          </div>
        ) : null}

        <div className="mx-auto mt-10 w-full sm:mt-12">
          <p className="mb-5 text-center text-base font-bold text-foreground sm:text-lg">
            {pageKeyword} 자주 묻는 질문
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
          <span>{pageKeyword} · 건강·계약·케어를 함께 확인하세요</span>
        </div>
      </div>
    </section>
  );
}
