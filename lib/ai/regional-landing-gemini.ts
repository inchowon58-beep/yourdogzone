import "server-only";

import type {
  RegionalFaqItemStored,
  RegionalSeoBlockStored,
} from "@/lib/types/regional-landing";

export type RegionalLandingGeminiContent = {
  regionInfo: string;
  nearbyIntro: string;
  metaDescription: string;
  seoBlocks: RegionalSeoBlockStored[];
  faqItems: RegionalFaqItemStored[];
};

export type RegionalGeminiResult =
  | { ok: true; data: RegionalLandingGeminiContent }
  | { ok: false; error: string };

const REGIONAL_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.0-flash-lite",
];

const WRITING_ANGLES = [
  "통학·접근성과 생활권 중심",
  "국비지원·수강료 비교 중심",
  "실습견·자격증 취득 과정 중심",
  "취업·창업 준비생 관점",
  "처음 알아보는 입문자 관점",
];

function pickAngle(): string {
  const idx = Math.floor(Math.random() * WRITING_ANGLES.length);
  return WRITING_ANGLES[idx] ?? WRITING_ANGLES[0];
}

function parseRegionalContent(
  text: string,
  model: string
): RegionalGeminiResult {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text) as {
      regionInfo?: string;
      nearbyIntro?: string;
      metaDescription?: string;
      seoBlocks?: RegionalSeoBlockStored[];
      faqItems?: RegionalFaqItemStored[];
    };

    if (!parsed.regionInfo?.trim() || !Array.isArray(parsed.seoBlocks)) {
      return { ok: false, error: `Gemini ${model}: 필수 필드 누락` };
    }

    const seoBlocks = parsed.seoBlocks
      .filter((b) => b?.title && Array.isArray(b.paragraphs))
      .slice(0, 3)
      .map((b) => ({
        title: String(b.title).slice(0, 120),
        paragraphs: b.paragraphs
          .map((p) => String(p).slice(0, 600))
          .filter(Boolean)
          .slice(0, 4),
        bullets: (b.bullets ?? [])
          .map((x) => String(x).slice(0, 200))
          .filter(Boolean)
          .slice(0, 6),
      }));

    const faqItems = (parsed.faqItems ?? [])
      .filter((f) => f?.question && f?.answer)
      .slice(0, 5)
      .map((f) => ({
        question: String(f.question).slice(0, 120),
        answer: String(f.answer).slice(0, 500),
      }));

    if (seoBlocks.length < 2) {
      return { ok: false, error: `Gemini ${model}: seoBlocks 부족` };
    }

    return {
      ok: true,
      data: {
        regionInfo: String(parsed.regionInfo).slice(0, 500),
        nearbyIntro: String(
          parsed.nearbyIntro ??
            "근방 지역에서 함께 검색하는 애견미용학원 정보입니다."
        ).slice(0, 300),
        metaDescription: String(
          parsed.metaDescription ?? parsed.regionInfo
        ).slice(0, 160),
        seoBlocks,
        faqItems:
          faqItems.length >= 3
            ? faqItems
            : [
                {
                  question: `${parsed.regionInfo?.slice(0, 10) ?? "지역"} 애견미용학원 수강료는?`,
                  answer:
                    "과정·등급에 따라 150만~1,200만 원대이며 국비지원 여부를 상담 시 확인하세요.",
                },
              ],
      },
    };
  } catch {
    return { ok: false, error: `Gemini ${model}: JSON 파싱 실패` };
  }
}

async function callRegionalGemini(
  apiKey: string,
  model: string,
  prompt: string
): Promise<RegionalGeminiResult> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.95,
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!res.ok) {
    const detail = (await res.text()).slice(0, 200);
    return { ok: false, error: `Gemini ${model} HTTP ${res.status}: ${detail}` };
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) {
    return { ok: false, error: `Gemini ${model}: 응답 없음` };
  }

  return parseRegionalContent(text, model);
}

export async function generateRegionalLandingWithGemini(input: {
  label: string;
  keyword: string;
  regionBig?: string;
  nearbyLabels: string[];
}): Promise<RegionalGeminiResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "GEMINI_API_KEY 미설정" };
  }

  const envModel = process.env.GEMINI_MODEL?.trim();
  const models = [
    ...(envModel ? [envModel] : []),
    ...REGIONAL_MODELS.filter((m) => m !== envModel),
  ];

  const angle = pickAngle();
  const nearby = input.nearbyLabels.slice(0, 5).join(", ") || "인근 도시";
  const regionLine = input.regionBig
    ? `${input.regionBig} ${input.label}`
    : input.label;

  const prompt = `당신은 반려견 포털 '유아독존'의 SEO 에디터입니다.
${input.label} 지역 애견미용학원 랜딩 페이지용 **고유한** 한국어 콘텐츠를 작성하세요.
이전 페이지와 겹치지 않게, 이번 작성 관점: ${angle}
키워드: ${input.keyword}
지역: ${regionLine}
인근 지역: ${nearby}

네이버 검색에 도움이 되도록 지역명·애견미용학원·자격증·수강료·국비지원·실습견 등을 자연스럽게 포함하세요.
과장·허위 통계는 쓰지 말고, 일반적으로 알려진 범위만 사용하세요.

반드시 아래 JSON만 출력:
{
  "regionInfo": "히어로 아래 소개 문단 (2~3문장, 120~200자)",
  "nearbyIntro": "근방 지역 안내 한 문단 (80~120자)",
  "metaDescription": "검색 결과용 설명 (140자 내외)",
  "seoBlocks": [
    {
      "title": "소제목",
      "paragraphs": ["문단1", "문단2"],
      "bullets": ["체크1", "체크2", "체크3", "체크4"]
    }
  ],
  "faqItems": [
    { "question": "질문", "answer": "답변 2~3문장" }
  ]
}

seoBlocks는 2개, faqItems는 4개 작성.`;

  const errors: string[] = [];

  for (const model of models) {
    const result = await callRegionalGemini(apiKey, model, prompt);
    if (result.ok) return result;
    errors.push(result.error);
    if (result.error.includes("HTTP 404")) continue;
  }

  return {
    ok: false,
    error: errors.slice(0, 2).join(" | ") || "Gemini 호출 실패",
  };
}
