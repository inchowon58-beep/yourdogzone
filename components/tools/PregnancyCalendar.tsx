"use client";

import { useMemo, useState } from "react";
import {
  BIRTH_KIT_MASTER,
  DOG_GESTATION_DAYS,
  DOG_GESTATION_RANGE,
  PREGNANCY_WEEKS,
  buildPregnancyPlan,
  formatKoDate,
  formatShortDate,
  weekDateRange,
  type PregnancyWeek,
} from "@/lib/tools/pregnancy";
import { Callout, Pill, ToolHeroImage } from "@/components/tools/ToolUi";

function todayInputValue() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function PregnancyCalendar() {
  const [mating, setMating] = useState("");
  const [name, setName] = useState("");
  const [show, setShow] = useState(false);
  const [openWeek, setOpenWeek] = useState<PregnancyWeek | null>(null);

  const plan = useMemo(
    () => (show ? buildPregnancyPlan(mating) : null),
    [show, mating]
  );

  function runCalc() {
    const p = buildPregnancyPlan(mating);
    if (!p) return;
    setShow(true);
    const w =
      p.currentWeek >= 1 && p.currentWeek <= 9
        ? (p.currentWeek as PregnancyWeek)
        : p.currentWeek >= 10
          ? 9
          : 1;
    setOpenWeek(w);
  }

  return (
    <div className="space-y-6">
      <ToolHeroImage
        src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&q=80&auto=format&fit=crop"
        alt="임신·출산 케어가 필요한 강아지"
        badge={`평균 ${DOG_GESTATION_DAYS}일 · ${DOG_GESTATION_RANGE.min}~${DOG_GESTATION_RANGE.max}일 변동`}
      />

      {!show || !plan ? (
        <div className="rounded-2xl bg-white p-5 shadow-[var(--card-shadow)] sm:p-6">
          <p className="text-sm font-bold text-foreground">교배일 입력</p>
          <p className="mt-1 text-sm text-muted">
            마지막 교배일(또는 확인된 교배일)을 넣으면 출산 예정일과 9주 케어
            캘린더가 만들어집니다.
          </p>

          <label className="mt-5 block">
            <span className="text-sm font-bold">교배일</span>
            <input
              type="date"
              value={mating}
              max={todayInputValue()}
              onChange={(e) => setMating(e.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-rose-400 focus:bg-white"
            />
          </label>

          <label className="mt-4 block">
            <span className="text-sm font-bold">
              산모견 이름{" "}
              <span className="font-normal text-muted">(선택)</span>
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 초코맘"
              className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-rose-400 focus:bg-white"
            />
          </label>

          <button
            type="button"
            disabled={!mating}
            onClick={runCalc}
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-rose-500/25 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            출산 예정일 · 케어 캘린더 보기
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 via-pink-600 to-fuchsia-700 p-6 text-white shadow-[var(--card-shadow-hover)] sm:p-8">
            <Pill color="gray">유아독존 PREGNANCY CARD</Pill>
            <p className="mt-4 text-sm text-white/80">
              {name.trim() ? (
                <>
                  <strong className="text-white">{name.trim()}</strong>의 출산
                  예정일
                </>
              ) : (
                "산모견 출산 예정일"
              )}
            </p>
            <p className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              {formatKoDate(plan.dueDate)}
            </p>
            <p className="mt-3 text-sm text-white/85">
              예상 구간 {formatShortDate(plan.dueEarly)} ~{" "}
              {formatShortDate(plan.dueLate)}
              <span className="text-white/60">
                {" "}
                (교배 +{DOG_GESTATION_RANGE.min}~{DOG_GESTATION_RANGE.max}일)
              </span>
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-semibold backdrop-blur">
                {plan.phaseLabel}
              </span>
              {plan.daysPregnant >= 0 && plan.daysPregnant < DOG_GESTATION_DAYS ? (
                <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-semibold backdrop-blur">
                  D-{Math.max(0, plan.daysLeft)} · {plan.progressPercent}%
                </span>
              ) : null}
              {plan.currentWeek >= 1 && plan.currentWeek <= 9 ? (
                <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-semibold backdrop-blur">
                  지금 {plan.currentWeek}주차
                </span>
              ) : null}
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white transition-all"
                style={{ width: `${plan.progressPercent}%` }}
              />
            </div>
            <p className="mt-8 text-[11px] tracking-widest text-white/50">
              YOURDOGZONE · BREEDER CARE
            </p>
          </div>

          {plan.currentWeek >= 1 && plan.currentWeek <= 9 ? (
            <div className="rounded-2xl border border-rose-100 bg-rose-50/80 p-4">
              <p className="text-sm font-bold text-rose-800">
                이번 주 한눈에 · {PREGNANCY_WEEKS[plan.currentWeek - 1].emoji}{" "}
                {PREGNANCY_WEEKS[plan.currentWeek - 1].nickname}
              </p>
              <p className="mt-1 text-sm text-rose-950/80">
                {PREGNANCY_WEEKS[plan.currentWeek - 1].fetus[0]}
              </p>
              <button
                type="button"
                className="mt-3 text-sm font-bold text-rose-700 underline-offset-2 hover:underline"
                onClick={() => setOpenWeek(plan.currentWeek as PregnancyWeek)}
              >
                {plan.currentWeek}주차 상세 보기
              </button>
            </div>
          ) : null}

          <div className="rounded-2xl bg-white p-5 shadow-[var(--card-shadow)]">
            <p className="text-sm font-bold">주차별 케어 캘린더</p>
            <p className="mt-1 text-xs text-muted">
              카드를 누르면 태아 발달 · 영양 · 체크리스트가 펼쳐집니다.
            </p>
            <div className="mt-4 space-y-2">
              {PREGNANCY_WEEKS.map((week) => {
                const range = weekDateRange(plan.matingDate, week.week);
                const isNow = plan.currentWeek === week.week;
                const isOpen = openWeek === week.week;
                return (
                  <div
                    key={week.week}
                    className={`overflow-hidden rounded-2xl border ${
                      isNow
                        ? "border-rose-400 bg-rose-50/50"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenWeek(isOpen ? null : week.week)
                      }
                      className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left"
                    >
                      <div>
                        <p className="text-sm font-black text-foreground">
                          {week.emoji} {week.title}
                          {isNow ? (
                            <span className="ml-2 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
                              NOW
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {week.nickname} · {formatShortDate(range.start)}–
                          {formatShortDate(range.end)} · {week.dayRange}
                        </p>
                      </div>
                      <span className="text-sm text-muted">
                        {isOpen ? "▲" : "▼"}
                      </span>
                    </button>
                    {isOpen ? (
                      <div className="space-y-4 border-t border-gray-200/80 bg-white px-4 py-4">
                        <Section title="태아 발달" items={week.fetus} />
                        <Section title="산모견 케어" items={week.momCare} />
                        <Section title="영양 가이드" items={week.nutrition} />
                        <Section title="이번 주 체크리스트" items={week.checklist} />
                        {week.birthSigns?.length ? (
                          <Section
                            title="출산 임박 징후"
                            items={week.birthSigns}
                            tone="warn"
                          />
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-[var(--card-shadow)]">
            <p className="text-sm font-bold">출산 준비물 마스터 체크</p>
            <p className="mt-1 text-xs text-muted">
              8~9주차 전에 대부분 갖춰 두면 안심이에요.
            </p>
            <ul className="mt-3 space-y-2">
              {BIRTH_KIT_MASTER.map((item) => (
                <li
                  key={item}
                  className="flex gap-2 rounded-xl bg-fuchsia-50 px-3 py-2.5 text-sm text-fuchsia-950"
                >
                  <span className="font-bold text-fuchsia-600">□</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            onClick={() => {
              setShow(false);
              setOpenWeek(null);
            }}
            className="w-full rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold hover:bg-gray-50"
          >
            교배일 다시 입력
          </button>
        </div>
      )}

      <Callout tone="warn" title="전문 브리더·보호자용 참고 도구">
        실제 임신 기간은 개체·품종·배란 시점에 따라{" "}
        <strong>
          {DOG_GESTATION_RANGE.min}~{DOG_GESTATION_RANGE.max}일
        </strong>
        로 달라질 수 있습니다. 초음파·X-ray·프로게스테론은 수의사와 함께하고,
        난산 징후가 보이면 즉시 동물병원으로 가세요.
      </Callout>
    </div>
  );
}

function Section({
  title,
  items,
  tone = "ok",
}: {
  title: string;
  items: string[];
  tone?: "ok" | "warn";
}) {
  const box =
    tone === "warn"
      ? "bg-amber-50 text-amber-950"
      : "bg-rose-50/70 text-rose-950";
  const mark = tone === "warn" ? "!" : "✓";
  const markColor = tone === "warn" ? "text-amber-600" : "text-rose-500";
  return (
    <div>
      <p className="text-sm font-bold text-foreground">{title}</p>
      <ul className="mt-2 space-y-1.5">
        {items.map((item) => (
          <li
            key={item}
            className={`flex gap-2 rounded-xl px-3 py-2 text-[13px] leading-relaxed ${box}`}
          >
            <span className={`font-bold ${markColor}`}>{mark}</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
