"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  LOVE_QUESTIONS,
  POPULAR_BREEDS,
  buildHashtagText,
  computeLoveQuizResult,
  type LoveAnswers,
  type LoveResult,
} from "@/lib/tools/love-score";
import { Callout, Pill, ToolHeroImage } from "@/components/tools/ToolUi";

type Phase = "setup" | "quiz" | "loading" | "result";

const CARD_W = 1080;
const CARD_H = 1350;

async function drawShareCard(opts: {
  photoUrl: string;
  name: string;
  breed: string;
  result: LoveResult;
}): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("캔버스를 만들 수 없습니다.");

  const petName = opts.name.trim() || "우리 아이";
  const score = opts.result.score;

  const img = await loadImage(opts.photoUrl);
  const scale = Math.max(CARD_W / img.width, CARD_H / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, (CARD_W - dw) / 2, (CARD_H - dh) / 2, dw, dh);

  // 상단 살짝 어둡게
  const topGrad = ctx.createLinearGradient(0, 0, 0, 240);
  topGrad.addColorStop(0, "rgba(15,23,42,0.5)");
  topGrad.addColorStop(1, "rgba(15,23,42,0)");
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, CARD_W, 240);

  // 하단 그라데이션 (텍스트가 너무 바닥에 붙지 않게 위로)
  const bottomGrad = ctx.createLinearGradient(0, CARD_H - 520, 0, CARD_H);
  bottomGrad.addColorStop(0, "rgba(15,23,42,0)");
  bottomGrad.addColorStop(0.35, "rgba(15,23,42,0.45)");
  bottomGrad.addColorStop(1, "rgba(15,23,42,0.82)");
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(0, CARD_H - 520, CARD_W, 520);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // 메인 카피 — 위로 올림 (점수는 도장으로만)
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 58px Pretendard, Apple SD Gothic Neo, sans-serif";
  ctx.fillText(`${petName}의 엄마사랑지수`, CARD_W / 2, CARD_H - 360);

  // 사진 위 도장 (점수 대체)
  drawInkStamp(ctx, CARD_W * 0.72, CARD_H * 0.42, 210, score);

  // 하단 브랜드 바
  ctx.fillStyle = "rgba(255,255,255,0.96)";
  ctx.fillRect(0, CARD_H - 110, CARD_W, 110);
  ctx.fillStyle = "#0f172a";
  ctx.font = "800 40px Pretendard, Apple SD Gothic Neo, sans-serif";
  ctx.fillText("유아독존 사랑지수조회", CARD_W / 2, CARD_H - 55);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("이미지 생성 실패"))),
      "image/jpeg",
      0.92
    );
  });
}

/** 빨간 원형 도장 — 점수는 여기에만 표시 */
function drawInkStamp(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  diameter: number,
  score: number
) {
  const r = diameter / 2;
  const ink = score >= 95 ? "#be123c" : score >= 80 ? "#e11d48" : "#f43f5e";

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((-14 * Math.PI) / 180);
  ctx.globalAlpha = 0.9;

  // 반투명 속바탕 (사진 위에서도 읽히게)
  ctx.beginPath();
  ctx.arc(0, 0, r - 4, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 241, 242, 0.72)";
  ctx.fill();

  // 바깥 링
  ctx.beginPath();
  ctx.arc(0, 0, r - 3, 0, Math.PI * 2);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 10;
  ctx.stroke();

  // 중간 링
  ctx.beginPath();
  ctx.arc(0, 0, r - 22, 0, Math.PI * 2);
  ctx.lineWidth = 3.5;
  ctx.stroke();

  // 안쪽 링
  ctx.beginPath();
  ctx.arc(0, 0, r - 34, 0, Math.PI * 2);
  ctx.lineWidth = 1.8;
  ctx.globalAlpha = 0.75;
  ctx.stroke();
  ctx.globalAlpha = 0.92;

  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.font = "700 28px 'Noto Serif KR', Batang, serif";
  ctx.fillText("사랑지수", 0, -48);

  ctx.font = "900 78px 'Noto Serif KR', Batang, serif";
  ctx.fillText(`${score}%`, 0, 8);

  ctx.font = "700 22px 'Noto Serif KR', Batang, serif";
  ctx.fillText("유아독존 확인", 0, 58);

  ctx.restore();
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("사진을 불러오지 못했습니다."));
    img.src = src;
  });
}

export function LoveScoreAnalyzer() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<LoveAnswers>({});
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState("");
  const [result, setResult] = useState<LoveResult | null>(null);
  const [cardUrl, setCardUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const total = LOVE_QUESTIONS.length;
  const current = LOVE_QUESTIONS[index];

  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
      if (cardUrl) URL.revokeObjectURL(cardUrl);
    };
  }, [photoUrl, cardUrl]);

  const canStart = Boolean(photoUrl && name.trim() && breed.trim());

  function onPickFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 올려 주세요.");
      return;
    }
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    if (cardUrl) URL.revokeObjectURL(cardUrl);
    setCardUrl(null);
    setPhotoUrl(URL.createObjectURL(file));
    setPhotoName(file.name);
    setError("");
  }

  function startQuiz() {
    if (!canStart) return;
    setAnswers({});
    setIndex(0);
    setResult(null);
    setPhase("quiz");
  }

  async function finishQuiz(nextAnswers: LoveAnswers) {
    if (!photoUrl) return;
    setPhase("loading");
    const computed = computeLoveQuizResult(name, breed, nextAnswers);
    setResult(computed);
    await new Promise((r) => setTimeout(r, 1400));
    try {
      const blob = await drawShareCard({
        photoUrl,
        name: name.trim(),
        breed: breed.trim(),
        result: computed,
      });
      if (cardUrl) URL.revokeObjectURL(cardUrl);
      setCardUrl(URL.createObjectURL(blob));
      setPhase("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "결과 카드 생성 실패");
      setPhase("quiz");
    }
  }

  function pick(optionId: string) {
    if (!current) return;
    const next = { ...answers, [current.id]: optionId };
    setAnswers(next);
    if (index < total - 1) {
      setIndex(index + 1);
      return;
    }
    void finishQuiz(next);
  }

  function resetAll() {
    setPhase("setup");
    setIndex(0);
    setAnswers({});
    setResult(null);
  }

  async function downloadCard() {
    if (!cardUrl) return;
    const a = document.createElement("a");
    a.href = cardUrl;
    a.download = `${name.trim() || "puppy"}-사랑포인트.jpg`;
    a.click();
  }

  async function copyTags() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(
        buildHashtagText(name.trim(), result.tags)
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("클립보드 복사에 실패했습니다.");
    }
  }

  const hashtagPreview = useMemo(
    () =>
      result
        ? buildHashtagText(name.trim(), result.tags)
        : "#유아독존 #반려견사랑해",
    [result, name]
  );

  return (
    <div className="space-y-6">
      <ToolHeroImage
        src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1200&q=80&auto=format&fit=crop"
        alt="유아독존 사랑지수조회"
        badge="유아독존 사랑지수조회 · 12문항"
      />

      {phase === "setup" ? (
        <div className="space-y-4 rounded-2xl bg-white p-5 shadow-[var(--card-shadow)] sm:p-6">
          <Pill color="red">유아독존 사랑지수조회</Pill>
          <h2 className="text-xl font-black text-foreground">
            엄마사랑지수, 도장처럼 찍혀 나와요
          </h2>
          <p className="text-sm leading-relaxed text-muted">
            멍BTI처럼 <strong className="text-rose-700">한 문항씩</strong> 고르면
            다음으로 넘어가고, 마지막에 사랑지수(%)가 도장으로 확인됩니다.
          </p>

          <div>
            <p className="text-sm font-bold">강아지 사진 (필수)</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => onPickFile(e.target.files?.[0] || null)}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mt-3 flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-rose-200 bg-rose-50/50 px-4 py-8"
            >
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt="미리보기"
                  className="mb-3 h-40 w-40 rounded-2xl object-cover shadow-md"
                />
              ) : (
                <span className="mb-2 text-3xl">📷</span>
              )}
              <span className="text-sm font-bold text-rose-700">
                {photoUrl ? "사진 바꾸기" : "사진 업로드 / 촬영"}
              </span>
              {photoName ? (
                <span className="mt-1 text-xs text-muted">{photoName}</span>
              ) : null}
            </button>
          </div>

          <label className="block">
            <span className="text-sm font-bold">강아지 이름</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 초코"
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm outline-none focus:border-rose-400 focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold">견종</span>
            <input
              type="text"
              list="love-breed-list"
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              placeholder="선택하거나 직접 입력"
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm outline-none focus:border-rose-400 focus:bg-white"
            />
            <datalist id="love-breed-list">
              {POPULAR_BREEDS.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </label>

          {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}

          <button
            type="button"
            disabled={!canStart}
            onClick={startQuiz}
            className="w-full rounded-2xl bg-gradient-to-r from-rose-500 to-fuchsia-600 py-4 text-base font-bold text-white shadow-lg shadow-rose-500/25 disabled:cursor-not-allowed disabled:opacity-40"
          >
            사랑지수조회 시작 ({total}문항)
          </button>
        </div>
      ) : null}

      {phase === "quiz" && current ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-rose-600">
              문항 {index + 1} / {total}
            </span>
            <span className="text-muted">선택하면 다음으로</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-500 transition-all"
              style={{ width: `${((index + 1) / total) * 100}%` }}
            />
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-[var(--card-shadow)] sm:p-6">
            <h2 className="text-lg font-black text-foreground sm:text-xl">
              {current.title}
            </h2>
            {current.hint ? (
              <p className="mt-2 text-sm text-muted">{current.hint}</p>
            ) : null}

            <div className="mt-5 space-y-2">
              {current.options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => pick(opt.id)}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-left transition hover:border-rose-300 hover:bg-rose-50 active:scale-[0.99]"
                >
                  <span className="block text-sm font-bold text-foreground">
                    {opt.label}
                  </span>
                  {opt.detail ? (
                    <span className="mt-1 block text-[12px] text-muted">
                      {opt.detail}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>

            {index > 0 ? (
              <button
                type="button"
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                className="mt-4 text-sm font-semibold text-muted hover:text-foreground"
              >
                ← 이전 문항
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setPhase("setup")}
                className="mt-4 text-sm font-semibold text-muted hover:text-foreground"
              >
                ← 사진·이름 다시
              </button>
            )}
          </div>
        </div>
      ) : null}

      {phase === "loading" ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white px-6 py-16 shadow-[var(--card-shadow)]">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-rose-100 border-t-rose-500" />
          <p className="mt-6 text-lg font-black text-foreground">
            사랑지수 조회 중…
          </p>
          <p className="mt-2 text-sm text-muted">
            {name.trim() || "우리 아이"}의 엄마사랑지수를 도장으로 찍는 중이에요
          </p>
        </div>
      ) : null}

      {phase === "result" && result ? (
        <div className="relative space-y-4">
          {result.score >= 100 ? <FireworksBurst /> : null}

          <div className="relative overflow-hidden rounded-2xl border border-rose-100 bg-[#fff8f8] p-6 shadow-[var(--card-shadow-hover)] sm:p-8">
            <p className="text-xs font-bold tracking-wide text-rose-600">
              유아독존 사랑지수조회
            </p>
            <p className="mt-3 text-base font-bold leading-snug text-foreground sm:text-lg">
              {name.trim() || "우리 아이"}의 엄마사랑지수
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {result.headline}
            </p>

            <div className="relative mx-auto mt-8 flex min-h-[220px] items-center justify-center">
              <LoveScoreStamp score={result.score} />
            </div>

            {result.score >= 100 ? (
              <p className="mt-2 text-center text-sm font-bold text-amber-600">
                사랑지수 100% 달성! 폭죽 축하!
              </p>
            ) : null}

            <p className="mt-6 text-center text-base font-black text-foreground">
              {result.title}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {result.comment}
            </p>
            <p className="mt-5 rounded-2xl border border-rose-100 bg-white px-4 py-3 text-sm font-semibold leading-relaxed text-rose-800">
              💡 {result.advice}
            </p>
            {result.traits.length ? (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {result.traits.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {cardUrl ? (
            <div className="overflow-hidden rounded-2xl bg-white p-3 shadow-[var(--card-shadow)]">
              <p className="mb-2 px-1 text-sm font-bold">인스타 공유용 카드</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cardUrl}
                alt="유아독존 사랑지수조회 결과 카드"
                className="w-full rounded-xl"
              />
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => void downloadCard()}
              className="w-full rounded-2xl bg-rose-600 py-4 text-base font-bold text-white shadow-md"
            >
              이미지 저장하기
            </button>
            <button
              type="button"
              onClick={() => void copyTags()}
              className="w-full rounded-2xl border border-rose-200 bg-rose-50 py-4 text-base font-bold text-rose-700"
            >
              {copied ? "해시태그 복사 완료!" : "인스타 해시태그 복사하기"}
            </button>
            <button
              type="button"
              onClick={resetAll}
              className="w-full rounded-2xl border border-gray-200 bg-white py-3 text-sm font-semibold"
            >
              다시 하기
            </button>
          </div>

          <div className="rounded-2xl bg-white p-4 text-sm text-muted shadow-[var(--card-shadow)]">
            <p className="font-bold text-foreground">복사될 해시태그</p>
            <p className="mt-2 whitespace-pre-wrap break-all text-[13px]">
              {hashtagPreview}
            </p>
          </div>
        </div>
      ) : null}

      <Callout tone="info" title="진지한 관계 체크예요">
        점수는 65~100% 사이입니다. 아무 데나 배변·난장판·스킨십 거부는 감점되고,
        좋은 루틴·환영·매너는 가점됩니다. 의료·훈련 진단은 아니니 걱정되면
        전문가와 상담해 주세요.
      </Callout>
    </div>
  );
}

function LoveScoreStamp({ score }: { score: number }) {
  const ink =
    score >= 95
      ? "border-rose-700 text-rose-700"
      : score >= 80
        ? "border-rose-600 text-rose-600"
        : "border-rose-500 text-rose-500";

  return (
    <div className="love-stamp-slam relative" aria-label={`사랑지수 ${score}%`}>
      <div
        className={`love-stamp-face relative flex h-44 w-44 items-center justify-center rounded-full border-[5px] ${ink} sm:h-52 sm:w-52 sm:border-[6px]`}
      >
        <div
          className={`absolute inset-[7px] rounded-full border-2 ${ink.split(" ")[0]} opacity-80`}
        />
        <div
          className={`absolute inset-[14px] rounded-full border ${ink.split(" ")[0]} opacity-50`}
        />
        <div className="relative z-[1] flex flex-col items-center justify-center px-3 text-center">
          <span className="certificate-serif text-[11px] font-bold tracking-[0.2em] sm:text-xs">
            사랑지수
          </span>
          <span className="certificate-serif mt-1 text-5xl font-black leading-none tracking-tight sm:text-6xl">
            {score}
            <span className="text-2xl sm:text-3xl">%</span>
          </span>
          <span className="certificate-serif mt-2 text-[10px] font-bold tracking-wider sm:text-[11px]">
            유아독존 확인
          </span>
        </div>
      </div>
    </div>
  );
}

function FireworksBurst() {
  const sparks = Array.from({ length: 42 }, (_, i) => i);
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-10 h-80 overflow-hidden"
      aria-hidden
    >
      {sparks.map((i) => {
        const left = 2 + ((i * 23) % 96);
        const delay = (i % 10) * 0.1;
        const duration = 1.2 + (i % 5) * 0.15;
        const drift = ((i % 7) - 3) * 28;
        const rise = 160 + (i % 6) * 28;
        const color = [
          "#f43f5e",
          "#fbbf24",
          "#f472b6",
          "#a78bfa",
          "#34d399",
          "#38bdf8",
          "#fb923c",
        ][i % 7];
        const size = 6 + (i % 4) * 2;
        return (
          <span
            key={i}
            className="love-firework absolute bottom-8 rounded-full"
            style={
              {
                left: `${left}%`,
                width: size,
                height: size,
                background: color,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
                boxShadow: `0 0 10px ${color}, 0 0 20px ${color}`,
                "--fx-x": `${drift}px`,
                "--fx-y": `-${rise}px`,
              } as CSSProperties
            }
          />
        );
      })}
      <div className="love-firework-flash absolute left-1/2 top-16 h-24 w-24 -translate-x-1/2 rounded-full bg-amber-200/40 blur-2xl" />
    </div>
  );
}
