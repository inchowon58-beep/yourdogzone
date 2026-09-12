import "server-only";

import {
  GEMINI_MAX_RETRIES,
  GEMINI_RETRY_DELAY_MS,
  GeminiJsonParseError,
  isRetryableGeminiError,
  parseGeminiJson,
  sleep,
} from "@/lib/ai/parse-gemini-json";
import {
  dreamLongformCharCount,
  type DreamLongform,
} from "@/lib/dreams/longform-types";

const DREAM_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.6-flash",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash-lite",
];

const SYSTEM_PROMPT = `너는 20년 경력의 반려동물 심리 전문가이자 따뜻한 반려생활 상담사야.
유아독존(YourDogZone) 반려동물 꿈 해몽소의 수석 해몽가로, 검색 유입 독자도 오래 머무를 수 있도록 SEO를 감안한 깊이 있는 한국어 롱폼을 작성한다.

반드시 지킬 것:
1) 꿈의 상징적 의미 및 종합 해몽 (길몽/흉몽/심리몽/길흉혼재 중 하나로 omen 지정)
2) 상황별 세부 디테일 해석 2~4개 (분위기·행동 변화에 따른 심리)
3) 보호자의 무의식적 심리 상태 진단 (불안·그리움·스트레스 등 공감)
4) 오늘 당장 실천할 수 있는 펫 케어 팁
5) 본문 전체(공백 제외) 합계 최소 1,000자 이상. 가능하면 1,400~2,200자 분량.
6) 의학·점술 단정 금지. 위로·통찰·실무 조언 톤. 마크다운 코드펜스 없이 JSON만 출력.`;

export type DreamGenerateInput = {
  animalLabel: string;
  situationLabel: string;
  customText?: string;
  mood?: string | null;
  petName?: string;
  seoTitle?: string;
  seedSummary?: string;
};

export type DreamGeminiResult =
  | { ok: true; data: DreamLongform }
  | { ok: false; error: string };

function buildUserPrompt(input: DreamGenerateInput): string {
  const name = input.petName?.trim() || input.animalLabel;
  return `다음 반려동물 꿈을 전문 해몽서로 풀어 주세요.

- 동물: ${input.animalLabel}
- 이름(있으면): ${name}
- 꿈 상황: ${input.situationLabel}
- 추가 묘사: ${input.customText?.trim() || "(없음)"}
- 보호자 감정: ${input.mood || "(미선택)"}
- SEO 페이지 제목 힌트: ${input.seoTitle || "(없음)"}
- 기존 짧은 시드 요약(참고만, 그대로 복사 금지): ${input.seedSummary || "(없음)"}

반드시 아래 JSON만 출력:
{
  "omen": "길몽" | "흉몽" | "심리몽" | "길흉혼재",
  "headline": "감성적인 결과 타이틀 한 문장",
  "summaryBox": "핵심 의미 요약 2~4문장",
  "symbolism": "상징·종합 해몽 본문 (길게, 여러 문단을 \\n\\n로 구분)",
  "details": [
    { "title": "상황 디테일 소제목", "body": "세부 해석 문단" }
  ],
  "psychology": "보호자 무의식·심리 진단 본문 (길게)",
  "careTip": "오늘 실천할 펫 케어 팁 (구체적으로)",
  "quote": "본문 중간에 넣을 한 줄 인용/포인트"
}`;
}

function normalizeOmen(raw: unknown): DreamLongform["omen"] {
  const s = String(raw || "");
  if (s.includes("흉")) return "흉몽";
  if (s.includes("혼재") || s.includes("길흉")) return "길흉혼재";
  if (s.includes("심리")) return "심리몽";
  if (s.includes("길")) return "길몽";
  return "심리몽";
}

function normalizeLongform(raw: Partial<DreamLongform>, model: string): DreamGeminiResult {
  const details = Array.isArray(raw.details)
    ? raw.details
        .filter((d) => d && (d.title || d.body))
        .slice(0, 4)
        .map((d) => ({
          title: String(d.title || "상황 해석").slice(0, 80),
          body: String(d.body || "").slice(0, 2000),
        }))
        .filter((d) => d.body.length > 20)
    : [];

  const doc: DreamLongform = {
    omen: normalizeOmen(raw.omen),
    headline: String(raw.headline || "").slice(0, 120),
    summaryBox: String(raw.summaryBox || "").slice(0, 800),
    symbolism: String(raw.symbolism || "").slice(0, 5000),
    details,
    psychology: String(raw.psychology || "").slice(0, 4000),
    careTip: String(raw.careTip || "").slice(0, 2000),
    quote: String(raw.quote || "").slice(0, 200),
    generatedAt: new Date().toISOString(),
    source: "gemini",
  };

  if (!doc.headline || !doc.symbolism || !doc.psychology || !doc.careTip) {
    return { ok: false, error: `Gemini ${model}: 필수 필드 부족` };
  }
  if (details.length < 2) {
    return { ok: false, error: `Gemini ${model}: details 2개 이상 필요` };
  }
  if (dreamLongformCharCount(doc) < 800) {
    return {
      ok: false,
      error: `Gemini ${model}: 분량 부족 (${dreamLongformCharCount(doc)}자)`,
    };
  }
  return { ok: true, data: doc };
}

async function callDreamModel(
  apiKey: string,
  model: string,
  prompt: string
): Promise<DreamGeminiResult> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.85,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!res.ok) {
    const detail = (await res.text()).slice(0, 240);
    return { ok: false, error: `Gemini ${model} HTTP ${res.status}: ${detail}` };
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) {
    return { ok: false, error: `Gemini ${model}: 응답 텍스트 없음` };
  }

  try {
    const parsed = parseGeminiJson<Partial<DreamLongform>>(text);
    return normalizeLongform(parsed, model);
  } catch (e) {
    const preview =
      e instanceof GeminiJsonParseError ? e.rawPreview : text.slice(0, 80);
    return { ok: false, error: `Gemini ${model}: JSON 파싱 실패 (${preview})` };
  }
}

export async function generateDreamLongformWithGemini(
  input: DreamGenerateInput
): Promise<DreamGeminiResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "GEMINI_API_KEY 미설정" };
  }

  const envModel = process.env.GEMINI_MODEL?.trim();
  const models = [
    ...(envModel ? [envModel] : []),
    ...DREAM_MODELS.filter((m) => m !== envModel),
  ];

  const prompt = buildUserPrompt(input);
  const errors: string[] = [];

  for (const model of models) {
    for (let attempt = 1; attempt <= GEMINI_MAX_RETRIES; attempt++) {
      try {
        const result = await callDreamModel(apiKey, model, prompt);
        if (result.ok) return result;
        errors.push(result.error);
        console.error("[DreamGemini]", result.error);
        if (result.error.includes("HTTP 404")) break;
        if (
          attempt < GEMINI_MAX_RETRIES &&
          isRetryableGeminiError(result.error)
        ) {
          await sleep(GEMINI_RETRY_DELAY_MS);
          continue;
        }
        break;
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : "Gemini 알 수 없는 오류";
        errors.push(`Gemini ${model}: ${msg}`);
        if (attempt < GEMINI_MAX_RETRIES && isRetryableGeminiError(msg)) {
          await sleep(GEMINI_RETRY_DELAY_MS);
          continue;
        }
        break;
      }
    }
  }

  return {
    ok: false,
    error: [...new Set(errors)].slice(0, 3).join(" | ") || "Gemini 호출 실패",
  };
}
