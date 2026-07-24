import Image from "next/image";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Heart,
  Home,
  MessageCircle,
  PawPrint,
  Search,
  ShieldAlert,
  Stethoscope,
} from "lucide-react";
import {
  ADOPTION_COMMON_CHECKS,
  resolveAdoptionContentForm,
} from "@/lib/seo/adoption-content-forms";
import { CatBasicAdoptionGuide } from "@/components/regional/CatBasicAdoptionGuide";
import { DogBasicAdoptionGuide } from "@/components/regional/DogBasicAdoptionGuide";
import { sampleStableRandom } from "@/lib/utils/random-sample";

type Faq = { question: string; answer: string };

type Props = {
  label: string;
  pageKeyword: string;
  seedKey: string;
  faqItems: Faq[];
  coverImageUrl?: string | null;
  formId?: string | null;
  recommendedName?: string | null;
};

const HEADLINE_TAILS = [
  "꼭 확인하고 결정하세요",
  "신중히 비교한 뒤 선택하세요",
  "건강·계약을 먼저 보세요",
  "충동 분양은 피하세요",
] as const;

export function AdoptionRegionalTrustGuide({
  label,
  pageKeyword,
  seedKey,
  faqItems,
  coverImageUrl,
  formId,
  recommendedName,
}: Props) {
  const form = resolveAdoptionContentForm(formId);

  if (form.id === "cat_basic") {
    return (
      <CatBasicAdoptionGuide
        label={label}
        pageKeyword={pageKeyword}
        seedKey={seedKey}
        faqItems={faqItems}
        coverImageUrl={coverImageUrl}
        recommendedName={recommendedName}
      />
    );
  }

  if (form.id === "dog_basic") {
    return (
      <DogBasicAdoptionGuide
        label={label}
        pageKeyword={pageKeyword}
        seedKey={seedKey}
        faqItems={faqItems}
        coverImageUrl={coverImageUrl}
        recommendedName={recommendedName}
      />
    );
  }

  const isCat = form.species === "cat";
  const petWord = isCat ? "고양이" : "강아지";
  const adoptWord = "분양";

  const tail = sampleStableRandom(
    [...HEADLINE_TAILS],
    1,
    `${seedKey}-tail`
  )[0];
  const checks = sampleStableRandom(
    [...ADOPTION_COMMON_CHECKS],
    5,
    `${seedKey}-checks`
  );
  const traits = sampleStableRandom(form.traits, form.traits.length, seedKey);
  const care = sampleStableRandom(
    form.careNotes,
    form.careNotes.length,
    `${seedKey}-care`
  );

  const flow = isCat
    ? [
        {
          step: 1,
          title: "상담",
          body: "원하는 묘종·예산·합사 여부를 정리해 상담합니다.",
          icon: MessageCircle,
        },
        {
          step: 2,
          title: "방문·확인",
          body: "사육 환경과 아이 건강·성격을 직접 확인합니다.",
          icon: Search,
        },
        {
          step: 3,
          title: "계약·인수",
          body: "계약 조건·보증 범위를 확인한 뒤 인수합니다.",
          icon: ClipboardCheck,
        },
        {
          step: 4,
          title: "적응·케어",
          body: "병원 검진·독립 공간·화장실 적응을 돕습니다.",
          icon: Home,
        },
      ]
    : [
        {
          step: 1,
          title: "상담",
          body: "원하는 견종·예산·생활 환경을 정리해 상담합니다.",
          icon: MessageCircle,
        },
        {
          step: 2,
          title: "방문·확인",
          body: "사육 환경과 아이 건강·성격을 직접 확인합니다.",
          icon: Search,
        },
        {
          step: 3,
          title: "계약·인수",
          body: "계약 조건·보증 범위를 확인한 뒤 인수합니다.",
          icon: ClipboardCheck,
        },
        {
          step: 4,
          title: "적응·케어",
          body: "병원 검진·적응 훈련·일상 케어를 시작합니다.",
          icon: Stethoscope,
        },
      ];

  return (
    <section className="mb-12">
      <div className="relative overflow-hidden rounded-[1.75rem] border border-primary/10 bg-gradient-to-b from-sky-50/90 via-white to-amber-50/40 px-4 py-10 sm:px-8 sm:py-12 md:px-12 md:py-14">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-amber-200/20 blur-3xl" />

        <div className="relative mx-auto max-w-4xl text-center">
          <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-white/80 px-3 py-1 text-xs font-semibold text-primary sm:text-sm">
            <PawPrint className="h-3.5 w-3.5" aria-hidden />
            {form.label} 양식 · {label}
          </p>
          <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl md:text-4xl md:leading-tight">
            {form.headlineFocus}
            <span className="mt-1 block text-primary sm:mt-2">{tail}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            {label}에서 {pageKeyword}을(를) 알아볼 때,{" "}
            <strong className="font-semibold text-foreground">
              {form.subject}
            </strong>{" "}
            기준으로 확인해야 할 건강·계약·사육 환경 포인트를 정리했습니다.
          </p>
        </div>

        {coverImageUrl ? (
          <div className="relative mx-auto mt-8 aspect-[16/9] w-full max-w-3xl overflow-hidden rounded-2xl border border-white/80 shadow-[var(--card-shadow)] sm:mt-10">
            <Image
              src={coverImageUrl}
              alt={`${label} ${form.subject} ${adoptWord}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>
        ) : null}

        <div className="mx-auto mt-10 grid grid-cols-1 gap-4 sm:mt-12 lg:grid-cols-2">
          <GuideCard
            icon={ClipboardCheck}
            title={`${form.subject} · 분양 전 체크`}
            tone="primary"
          >
            <ul className="mt-4 space-y-2.5">
              {checks.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-[15px] leading-relaxed text-foreground sm:text-base"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </GuideCard>

          <GuideCard
            icon={Heart}
            title={`${form.subject} 특징 · 알아둘 점`}
            tone="amber"
          >
            <ul className="mt-4 space-y-2.5">
              {traits.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-[15px] leading-relaxed text-foreground sm:text-base"
                >
                  <PawPrint className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </GuideCard>
        </div>

        <div className="mx-auto mt-10 w-full sm:mt-12">
          <div className="rounded-2xl border border-red-100 bg-white px-6 py-8 shadow-[var(--card-shadow)] sm:px-10 sm:py-10">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <ShieldAlert className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <p className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
                  충동 {adoptWord}은 위험합니다.{" "}
                  <span className="text-red-600">한 번 더 확인하세요</span>
                </p>
                <p className="mt-3 text-base leading-relaxed text-muted sm:text-lg">
                  {form.warning} {label} {petWord}
                  {adoptWord}도 업체마다 환경·사후관리 수준이 크게 다릅니다.
                </p>
              </div>
            </div>
            <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                "사육·케어 환경을 확인할 수 있는가",
                "건강·접종 기록이 투명한가",
                "계약·보증 조건이 분명한가",
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

        <div className="mx-auto mt-10 w-full sm:mt-12">
          <div className="rounded-2xl border border-amber-100 bg-amber-50/70 px-6 py-8 sm:px-10 sm:py-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
                <AlertTriangle className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <p className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
                  {form.subject} 데려온 뒤 · 초기 케어
                </p>
                <ul className="mt-4 space-y-2.5">
                  {care.map((note) => (
                    <li
                      key={note}
                      className="flex items-start gap-2 text-base leading-relaxed text-muted sm:text-lg"
                    >
                      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-amber-700" />
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 w-full sm:mt-12">
          <p className="mb-5 text-center text-base font-bold text-foreground sm:text-lg">
            {form.subject} {adoptWord} · 이렇게 진행해 보세요
          </p>
          <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
            {flow.map(({ step, title, body, icon: Icon }) => (
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
              평생 가족,{" "}
              <span className="text-primary">신중하게</span>
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg md:text-xl md:leading-relaxed">
              {label}에서 {form.subject} {adoptWord}을 고민 중이라면, 외형보다
              건강·환경·계약을 먼저 보세요. 궁금한 점은 인증 추천 업체에
              전화로 문의하는 것이 가장 확실합니다.
            </p>
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

function GuideCard({
  icon: Icon,
  title,
  children,
  tone,
}: {
  icon: typeof Heart;
  title: string;
  children: ReactNode;
  tone: "primary" | "amber";
}) {
  const toneCls =
    tone === "amber"
      ? "border-amber-100 bg-white text-amber-800"
      : "border-primary/15 bg-white text-primary";
  const iconBg =
    tone === "amber" ? "bg-amber-50 text-amber-800" : "bg-primary/10 text-primary";

  return (
    <div
      className={`rounded-2xl border p-6 shadow-[var(--card-shadow)] sm:p-8 ${toneCls}`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <h3 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}
