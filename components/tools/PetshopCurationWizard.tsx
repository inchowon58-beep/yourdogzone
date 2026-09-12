"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { REGION_BIG_OPTIONS } from "@/lib/constants/regions";
import {
  ADOPT_COST_OPTIONS,
  ADOPT_WHEN_OPTIONS,
  ADOPT_WHERE_OPTIONS,
  ANIMAL_OPTIONS,
  CHANNEL_OPTIONS,
  CONCERN_OPTIONS,
  GENDER_OPTIONS,
  SHOP_PRIORITY_OPTIONS,
  SUGGESTED_BREEDS,
  TIMING_OPTIONS,
  buildCurationResult,
  canProceedStep,
  emptyAnswers,
  type AnimalPref,
  type ChannelId,
  type ConcernId,
  type CurationResult,
  type GenderPref,
  type MatchedShop,
  type PetshopAnswers,
  type ShopPriorityId,
  type TimingId,
} from "@/lib/tools/petshop-curation";
import { Callout, Pill, ToolHeroImage } from "@/components/tools/ToolUi";

type Phase = "wizard" | "loading" | "result";

const STEPS = [
  { n: 1, title: "기본 분양 선호도" },
  { n: 2, title: "분양 방식" },
  { n: 3, title: "시기 · 샵 우선순위" },
  { n: 4, title: "가장 걱정되는 점" },
  { n: 5, title: "기존 반려 이력" },
  { n: 6, title: "상담 연락처 (선택)" },
];

function toggleIn<T extends string>(list: T[], id: T): T[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

function ChoiceChip({
  active,
  label,
  hint,
  onClick,
}: {
  active: boolean;
  label: string;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-4 py-3 text-left transition ${
        active
          ? "border-indigo-500 bg-indigo-50 shadow-sm"
          : "border-gray-200 bg-white hover:border-indigo-200"
      }`}
    >
      <span
        className={`block text-sm font-bold ${
          active ? "text-indigo-800" : "text-foreground"
        }`}
      >
        {label}
      </span>
      {hint ? (
        <span className="mt-1 block text-xs leading-relaxed text-muted">
          {hint}
        </span>
      ) : null}
    </button>
  );
}

export function PetshopCurationWizard() {
  const [phase, setPhase] = useState<Phase>("wizard");
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<PetshopAnswers>(emptyAnswers);
  const [result, setResult] = useState<CurationResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [jsonCopied, setJsonCopied] = useState(false);

  const progress = useMemo(() => (step / STEPS.length) * 100, [step]);

  function patch(p: Partial<PetshopAnswers>) {
    setAnswers((prev) => ({ ...prev, ...p }));
    setError("");
  }

  function next() {
    const check = canProceedStep(step, answers);
    if (!check.ok) {
      setError(check.message || "입력을 확인해 주세요.");
      return;
    }
    if (step < STEPS.length) {
      setStep((s) => s + 1);
      setError("");
      return;
    }
    void finish();
  }

  async function finish() {
    setPhase("loading");
    setError("");
    const started = Date.now();
    let listingShops: MatchedShop[] = [];
    try {
      const res = await fetch("/api/tools/petshop-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          regionBig: answers.regionBig,
          regionAny: answers.regionAny,
          breed: answers.breed,
          breedAny: answers.breedAny,
          channels: answers.channels,
          concerns: answers.concerns,
          shopPriorities: answers.shopPriorities,
          timing: answers.timing,
        }),
      });
      const data = (await res.json()) as { shops?: MatchedShop[] };
      listingShops = data.shops || [];
    } catch {
      listingShops = [];
    }
    const wait = Math.max(0, 2000 - (Date.now() - started));
    await new Promise((r) => setTimeout(r, wait));
    setResult(buildCurationResult(answers, listingShops));
    setPhase("result");
  }

  function resetAll() {
    setPhase("wizard");
    setStep(1);
    setAnswers(emptyAnswers());
    setResult(null);
    setError("");
    setCopied(false);
    setJsonCopied(false);
  }

  async function copyCrmText() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.crmText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("복사에 실패했습니다.");
    }
  }

  async function copyCrmJson() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(result.crmPayload, null, 2)
      );
      setJsonCopied(true);
      setTimeout(() => setJsonCopied(false), 2000);
    } catch {
      setError("JSON 복사에 실패했습니다.");
    }
  }

  return (
    <div className="space-y-6">
      <ToolHeroImage
        src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&q=80&auto=format&fit=crop"
        alt="유아독존 펫샵선택도우미"
        badge="맞춤 분양 큐레이션 · 안심제휴 매칭"
      />

      <Callout tone="danger" title="‘무료분양’ 미끼 광고, 먼저 걸러 주세요">
        <p>
          강아지를 분양하는 펫샵은{" "}
          <strong className="text-foreground">돈을 버는 영리 매장</strong>
          이지, 비영리 기관이 아닙니다. 그런데도 “완전 무료 분양”, “오늘만
          0원”처럼 광고한다면{" "}
          <strong className="text-foreground">
            파양견·유기견·믹스견 등 정당한 책임분양을 제외하면 99% 허위일
            가능성
          </strong>
          이 큽니다.
        </p>
        <p className="mt-2">
          <strong className="text-foreground">예:</strong> SNS에서 “말티즈 무료
          분양” → 연락하니 “예방접종·운송비·케어비”로 수십만 원을 추가로 요구하거나,
          입금만 받고 잠적하는 식입니다.{" "}
          <strong className="text-foreground">
            무료를 미끼로 추가금이 생기는 곳은 피하는 것이 좋습니다.
          </strong>
        </p>
      </Callout>

      {phase === "wizard" ? (
        <div className="overflow-hidden rounded-2xl bg-white shadow-[var(--card-shadow)]">
          <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <Pill color="violet">Step {step} / {STEPS.length}</Pill>
              <span className="text-xs font-semibold text-muted">
                {STEPS[step - 1]?.title}
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="space-y-5 px-5 py-6 sm:px-6">
            {step === 1 ? (
              <Step1 answers={answers} patch={patch} />
            ) : null}
            {step === 2 ? (
              <Step2 answers={answers} patch={patch} />
            ) : null}
            {step === 3 ? (
              <StepTimingPriority answers={answers} patch={patch} />
            ) : null}
            {step === 4 ? (
              <StepConcerns answers={answers} patch={patch} />
            ) : null}
            {step === 5 ? (
              <StepHistory answers={answers} patch={patch} />
            ) : null}
            {step === 6 ? (
              <StepContact answers={answers} patch={patch} />
            ) : null}

            {error ? (
              <p className="text-sm font-semibold text-red-600">{error}</p>
            ) : null}

            <div className="flex gap-2 pt-2">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    setStep((s) => s - 1);
                    setError("");
                  }}
                  className="rounded-2xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-bold"
                >
                  이전
                </button>
              ) : null}
              <button
                type="button"
                onClick={next}
                className="flex-1 rounded-2xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-md hover:bg-indigo-700"
              >
                {step === STEPS.length ? "맞춤 가이드 보기" : "다음"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {phase === "loading" ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white px-6 py-16 shadow-[var(--card-shadow)]">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
          <p className="mt-6 text-center text-lg font-black text-foreground">
            최적의 분양 가이드 매칭 중…
          </p>
          <p className="mt-3 max-w-md text-center text-sm leading-relaxed text-muted">
            입력하신 조건(지역, 성향, 분양 경로, 우려 사항)을 바탕으로 맞춤
            가이드와 안심제휴 펫샵을 매칭하고 있습니다.
          </p>
        </div>
      ) : null}

      {phase === "result" && result ? (
        <ResultView
          result={result}
          copied={copied}
          jsonCopied={jsonCopied}
          onCopyText={() => void copyCrmText()}
          onCopyJson={() => void copyCrmJson()}
          onReset={resetAll}
        />
      ) : null}

      <Callout tone="info" title="상담·CRM용으로도 쓸 수 있어요">
        응답 내용은 결과 화면에서 텍스트·JSON으로 복사할 수 있습니다. 안심제휴
        펫샵은 관리자 설정(`PARTNER_SHOPS`)과 등록된 분양·브리더 목록을 함께
        매칭합니다.
      </Callout>
    </div>
  );
}

function Step1({
  answers,
  patch,
}: {
  answers: PetshopAnswers;
  patch: (p: Partial<PetshopAnswers>) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black">어떤 아이를 찾고 계신가요?</h2>
        <p className="mt-1 text-sm text-muted">
          기본 선호를 알려 주시면 지역·품종에 맞는 샵을 우선 보여 드려요.
        </p>
      </div>

      <Field label="분양 희망 동물">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {ANIMAL_OPTIONS.map((o) => (
            <ChoiceChip
              key={o.id}
              active={answers.animals.includes(o.id)}
              label={o.label}
              onClick={() => {
                if (o.id === "any") {
                  patch({ animals: ["any"] });
                  return;
                }
                const next = toggleIn(
                  answers.animals.filter((x) => x !== "any"),
                  o.id as AnimalPref
                );
                patch({ animals: next });
              }}
            />
          ))}
        </div>
      </Field>

      <Field label="희망 견종 / 묘종">
        <label className="mb-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={answers.breedAny}
            onChange={(e) =>
              patch({
                breedAny: e.target.checked,
                breed: e.target.checked ? "" : answers.breed,
              })
            }
          />
          <span className="font-semibold">견종/묘종 상관없음</span>
        </label>
        {!answers.breedAny ? (
          <>
            <input
              type="text"
              list="petshop-breed-list"
              value={answers.breed}
              onChange={(e) => patch({ breed: e.target.value })}
              placeholder="예: 보스턴테리어, 렉돌"
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm outline-none focus:border-indigo-400 focus:bg-white"
            />
            <datalist id="petshop-breed-list">
              {SUGGESTED_BREEDS.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </>
        ) : null}
      </Field>

      <Field label="희망 지역">
        <label className="mb-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={answers.regionAny}
            onChange={(e) =>
              patch({
                regionAny: e.target.checked,
                regionBig: e.target.checked ? "" : answers.regionBig,
                regionSmall: e.target.checked ? "" : answers.regionSmall,
              })
            }
          />
          <span className="font-semibold">지역 관계없음</span>
        </label>
        {!answers.regionAny ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <select
              value={answers.regionBig}
              onChange={(e) => patch({ regionBig: e.target.value })}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm outline-none focus:border-indigo-400 focus:bg-white"
            >
              <option value="">시·도 선택</option>
              {REGION_BIG_OPTIONS.filter((r) => r !== "전체").map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={answers.regionSmall}
              onChange={(e) => patch({ regionSmall: e.target.value })}
              placeholder="시/구 (예: 강남구, 고양시)"
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm outline-none focus:border-indigo-400 focus:bg-white"
            />
          </div>
        ) : null}
      </Field>

      <Field label="성별 선호">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {GENDER_OPTIONS.map((o) => (
            <ChoiceChip
              key={o.id}
              active={answers.gender === o.id}
              label={o.label}
              onClick={() => patch({ gender: o.id as GenderPref })}
            />
          ))}
        </div>
      </Field>
    </div>
  );
}

function Step2({
  answers,
  patch,
}: {
  answers: PetshopAnswers;
  patch: (p: Partial<PetshopAnswers>) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black">어떤 분양 방식이 편하신가요?</h2>
        <p className="mt-1 text-sm text-muted">
          펫샵 분양 기준으로 선택해 주세요. 복수 선택 가능합니다.
        </p>
      </div>
      <div className="grid gap-2">
        {CHANNEL_OPTIONS.map((o) => (
          <ChoiceChip
            key={o.id}
            active={answers.channels.includes(o.id)}
            label={o.label}
            hint={o.hint}
            onClick={() =>
              patch({ channels: toggleIn(answers.channels, o.id as ChannelId) })
            }
          />
        ))}
      </div>
    </div>
  );
}

function StepTimingPriority({
  answers,
  patch,
}: {
  answers: PetshopAnswers;
  patch: (p: Partial<PetshopAnswers>) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black">언제 분양을 원하시나요?</h2>
        <p className="mt-1 text-sm text-muted">
          시기에 따라 재고·분양가가 달라질 수 있어요. 예약도 괜찮다면 알려
          주세요.
        </p>
      </div>
      <div className="grid gap-2">
        {TIMING_OPTIONS.map((o) => (
          <ChoiceChip
            key={o.id}
            active={answers.timing === o.id}
            label={o.label}
            hint={o.hint}
            onClick={() => patch({ timing: o.id as TimingId })}
          />
        ))}
      </div>

      <div>
        <h2 className="text-xl font-black">샵을 고를 때 뭐가 더 중요해요?</h2>
        <p className="mt-1 text-sm text-muted">복수 선택 가능합니다.</p>
      </div>
      <div className="grid gap-2">
        {SHOP_PRIORITY_OPTIONS.map((o) => (
          <ChoiceChip
            key={o.id}
            active={answers.shopPriorities.includes(o.id)}
            label={o.label}
            hint={o.hint}
            onClick={() =>
              patch({
                shopPriorities: toggleIn(
                  answers.shopPriorities,
                  o.id as ShopPriorityId
                ),
              })
            }
          />
        ))}
      </div>
    </div>
  );
}

function StepConcerns({
  answers,
  patch,
}: {
  answers: PetshopAnswers;
  patch: (p: Partial<PetshopAnswers>) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black">가장 걱정되는 점은?</h2>
        <p className="mt-1 text-sm text-muted">
          선택한 우려에 맞춰 체크포인트와 제휴샵 태그를 구성합니다.
        </p>
      </div>
      <div className="grid gap-2">
        {CONCERN_OPTIONS.map((o) => (
          <ChoiceChip
            key={o.id}
            active={answers.concerns.includes(o.id)}
            label={o.label}
            onClick={() =>
              patch({
                concerns: toggleIn(answers.concerns, o.id as ConcernId),
              })
            }
          />
        ))}
      </div>
    </div>
  );
}

function StepHistory({
  answers,
  patch,
}: {
  answers: PetshopAnswers;
  patch: (p: Partial<PetshopAnswers>) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black">기존 반려 이력이 있나요?</h2>
        <p className="mt-1 text-sm text-muted">
          상담 시 성향을 파악하는 데 도움이 됩니다.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <ChoiceChip
          active={answers.hasPet === true}
          label="예, 키우고 있어요 / 키운 적 있어요"
          onClick={() => patch({ hasPet: true })}
        />
        <ChoiceChip
          active={answers.hasPet === false}
          label="아니요, 처음이에요"
          onClick={() =>
            patch({
              hasPet: false,
              adoptWhen: "",
              adoptWhere: "",
              adoptCost: "",
              petGender: "",
              petBreed: "",
            })
          }
        />
      </div>

      {answers.hasPet ? (
        <div className="space-y-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
          <Field label="언제 입양하셨나요?">
            <select
              value={answers.adoptWhen}
              onChange={(e) => patch({ adoptWhen: e.target.value })}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm"
            >
              <option value="">선택</option>
              {ADOPT_WHEN_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
          <Field label="어디서 입양하셨나요?">
            <select
              value={answers.adoptWhere}
              onChange={(e) => patch({ adoptWhere: e.target.value })}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm"
            >
              <option value="">선택</option>
              {ADOPT_WHERE_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
          <Field label="당시 분양 비용은?">
            <select
              value={answers.adoptCost}
              onChange={(e) => patch({ adoptCost: e.target.value })}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm"
            >
              <option value="">선택 (선택사항)</option>
              {ADOPT_COST_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="아이 성별">
              <input
                type="text"
                value={answers.petGender}
                onChange={(e) => patch({ petGender: e.target.value })}
                placeholder="암컷 / 수컷"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm"
              />
            </Field>
            <Field label="품종">
              <input
                type="text"
                value={answers.petBreed}
                onChange={(e) => patch({ petBreed: e.target.value })}
                placeholder="예: 푸들"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm"
              />
            </Field>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StepContact({
  answers,
  patch,
}: {
  answers: PetshopAnswers;
  patch: (p: Partial<PetshopAnswers>) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black">상담 연결용 연락처 (선택)</h2>
        <p className="mt-1 text-sm text-muted">
          입력하시면 상담 요약에 함께 담깁니다. 건너뛰어도 결과는 볼 수 있어요.
        </p>
      </div>
      <Field label="이름 / 호칭">
        <input
          type="text"
          value={answers.contactName}
          onChange={(e) => patch({ contactName: e.target.value })}
          placeholder="예: 김○○"
          className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm outline-none focus:border-indigo-400 focus:bg-white"
        />
      </Field>
      <Field label="연락처">
        <input
          type="tel"
          value={answers.contactPhone}
          onChange={(e) => patch({ contactPhone: e.target.value })}
          placeholder="010-0000-0000"
          className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm outline-none focus:border-indigo-400 focus:bg-white"
        />
      </Field>
      <Field label="상담 메모">
        <textarea
          value={answers.memo}
          onChange={(e) => patch({ memo: e.target.value })}
          rows={3}
          placeholder="예산대, 방문 가능 요일 등"
          className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm outline-none focus:border-indigo-400 focus:bg-white"
        />
      </Field>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-foreground">{label}</p>
      {children}
    </div>
  );
}

function ResultView({
  result,
  copied,
  jsonCopied,
  onCopyText,
  onCopyJson,
  onReset,
}: {
  result: CurationResult;
  copied: boolean;
  jsonCopied: boolean;
  onCopyText: () => void;
  onCopyJson: () => void;
  onReset: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 p-6 text-white shadow-[var(--card-shadow-hover)] sm:p-8">
        <Pill color="gray">맞춤 큐레이션 리포트</Pill>
        <h2 className="mt-4 text-2xl font-black tracking-tight">
          {result.reportTitle}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-white/85">
          {result.summaryLine}
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="px-1 text-base font-black text-foreground">
          고민별 체크포인트
        </h3>
        {result.advice.map((block) => (
          <div
            key={block.id}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[var(--card-shadow)]"
          >
            <p className="text-sm font-black text-indigo-700">{block.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {block.body}
            </p>
            <ul className="mt-3 space-y-1.5">
              {block.checkpoints.map((c) => (
                <li
                  key={c}
                  className="flex gap-2 text-sm text-foreground before:mt-2 before:h-1.5 before:w-1.5 before:shrink-0 before:rounded-full before:bg-indigo-500"
                >
                  {c}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-end justify-between gap-2 px-1">
          <h3 className="text-base font-black text-foreground">
            안심제휴 · 매칭 펫샵
          </h3>
          <Link
            href="/services/adoption"
            className="text-xs font-bold text-indigo-600 hover:underline"
          >
            분양업체 전체 보기
          </Link>
        </div>
        {result.shops.length ? (
          result.shops.map((shop) => <ShopCard key={shop.id} shop={shop} />)
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-sm text-muted">
            조건에 맞는 등록 업체가 아직 적습니다. 안심 상담으로 전국 제휴샵을
            연결해 드릴 수 있어요.
            <div className="mt-3">
              <Link
                href="/services/adoption"
                className="font-bold text-indigo-600 hover:underline"
              >
                강아지분양 목록 보기 →
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-[var(--card-shadow)] sm:p-6">
        <h3 className="text-base font-black">상담 데이터 요약</h3>
        <p className="mt-1 text-sm text-muted">
          카카오·CRM에 붙여 넣을 수 있게 정리했습니다.
        </p>
        <pre className="mt-4 max-h-64 overflow-auto rounded-2xl bg-slate-50 p-4 text-[12px] leading-relaxed text-slate-700 whitespace-pre-wrap break-all">
          {result.crmText}
        </pre>
        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={onCopyText}
            className="w-full rounded-2xl bg-indigo-600 py-4 text-base font-bold text-white shadow-md"
          >
            {copied ? "상담 요약 복사 완료!" : "상담 요약 복사하기"}
          </button>
          <button
            type="button"
            onClick={onCopyJson}
            className="w-full rounded-2xl border border-indigo-200 bg-indigo-50 py-3.5 text-sm font-bold text-indigo-700"
          >
            {jsonCopied ? "JSON 복사 완료!" : "CRM용 JSON 복사"}
          </button>
          <a
            href="/services/adoption"
            className="block w-full rounded-2xl border border-emerald-200 bg-emerald-50 py-3.5 text-center text-sm font-bold text-emerald-800"
          >
            안심 분양 상담 · 업체 찾아보기
          </a>
          <button
            type="button"
            onClick={onReset}
            className="w-full rounded-2xl border border-gray-200 bg-white py-3 text-sm font-semibold"
          >
            다시 하기
          </button>
        </div>
      </div>
    </div>
  );
}

function ShopCard({ shop }: { shop: MatchedShop }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[var(--card-shadow)]">
      <div className="flex gap-4 p-4 sm:p-5">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-indigo-50">
          {shop.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shop.image}
              alt={shop.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-indigo-400">
              안심제휴
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {shop.isPartner ? (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                안심제휴
              </span>
            ) : null}
            {shop.isPremium ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                추천
              </span>
            ) : null}
          </div>
          <h4 className="mt-1 truncate text-base font-black text-foreground">
            {shop.name}
          </h4>
          <p className="mt-0.5 text-xs text-muted">
            {shop.region}
            {shop.address ? ` · ${shop.address}` : ""}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-indigo-700">
            {shop.matchReason}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {shop.tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-2 border-t border-gray-50 px-4 py-3 sm:px-5">
        <Link
          href={shop.href}
          className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-center text-sm font-bold text-white"
        >
          안심 분양 상담하기
        </Link>
        {shop.phone ? (
          <a
            href={`tel:${shop.phone}`}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold"
          >
            전화
          </a>
        ) : null}
        {shop.kakaoUrl ? (
          <a
            href={shop.kakaoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-yellow-300 bg-yellow-50 px-4 py-2.5 text-sm font-bold text-yellow-900"
          >
            카톡
          </a>
        ) : null}
      </div>
    </article>
  );
}
