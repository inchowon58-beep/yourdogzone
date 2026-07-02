import "server-only";

import type {
  RegionalFaqItemStored,
  RegionalSeoBlockStored,
} from "@/lib/types/regional-landing";
import {
  GEMINI_MAX_RETRIES,
  GEMINI_RETRY_DELAY_MS,
  GeminiJsonParseError,
  isRetryableGeminiError,
  parseGeminiJson,
  sleep,
} from "@/lib/ai/parse-gemini-json";
import {
  NEARBY_ACADEMY_VAR,
  NEARBY_HIGHLIGHT_VAR,
  NEARBY_REGION_VAR,
  RECOMMENDED_ACADEMY_VAR,
  RECOMMENDED_HIGHLIGHT_VAR,
  REGION_VAR,
} from "@/lib/academy/regional-seo-vars";
import { formatStationName } from "@/lib/constants/region-nearby-stations";

export type RegionalLandingGeminiContent = {
  regionInfo: string;
  metaDescription: string;
  seoBlocks: RegionalSeoBlockStored[];
  faqItems: RegionalFaqItemStored[];
  nearbyAreas: string[];
  nearbyStations: string[];
};

export type RegionalGeminiResult =
  | { ok: true; data: RegionalLandingGeminiContent }
  | { ok: false; error: string };

const REGIONAL_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.0-flash-lite",
];

type GeminiPart =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } };

function normalizeSeoBlocks(
  blocks: RegionalSeoBlockStored[] | undefined,
  model: string
): RegionalSeoBlockStored[] | { error: string } {
  if (!Array.isArray(blocks)) {
    return { error: `Gemini ${model}: seoBlocks 부족` };
  }
  const normalized = blocks
    .filter((b) => b?.title && Array.isArray(b.paragraphs))
    .slice(0, 4)
    .map((b) => ({
      title: String(b.title).slice(0, 120),
      paragraphs: b.paragraphs
        .map((p) => String(p).slice(0, 600))
        .filter(Boolean)
        .slice(0, 3),
      bullets: (b.bullets ?? [])
        .map((x) => String(x).slice(0, 160))
        .filter(Boolean)
        .slice(0, 5),
    }));
  if (normalized.length < 3) {
    return { error: `Gemini ${model}: seoBlocks 3개 이상 필요` };
  }
  return normalized;
}

function normalizeGeoList(raw: unknown, limit = 5): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x) => String(x).trim())
    .filter(Boolean)
    .slice(0, limit);
}

function normalizeNearbyAreas(raw: unknown, label: string): string[] {
  const key = label.trim();
  return normalizeGeoList(raw)
    .filter((area) => area !== key && !area.startsWith(`${key} `))
    .slice(0, 5);
}

function normalizeNearbyStations(raw: unknown): string[] {
  return normalizeGeoList(raw).map(formatStationName).slice(0, 5);
}

function normalizeFaqItems(
  items: RegionalFaqItemStored[] | undefined
): RegionalFaqItemStored[] {
  const faqItems = (items ?? [])
    .filter((f) => f?.question && f?.answer)
    .slice(0, 5)
    .map((f) => ({
      question: String(f.question).slice(0, 120),
      answer: String(f.answer).slice(0, 450),
    }));
  if (faqItems.length >= 3) return faqItems;
  return [
    {
      question: `{region} 애견미용학원 수강료는?`,
      answer:
        "과정·등급에 따라 150만~1,200만 원대이며 국비지원 여부를 상담 시 확인하세요.",
    },
    {
      question: `{region} 애견미용학원은 어떻게 고르나요?`,
      answer:
        "수강료·국비지원·실습견 환경·자격증 과정을 비교하고 방문 상담을 권합니다.",
    },
    {
      question: "인증 추천 학원이란?",
      answer:
        "유아독존이 검증한 학원으로 상단에 우선 노출됩니다.",
    },
  ];
}

function parseRegionalContent(
  text: string,
  model: string,
  label: string
): RegionalGeminiResult {
  let parsed: {
    regionInfo?: string;
    metaDescription?: string;
    seoBlocks?: RegionalSeoBlockStored[];
    faqItems?: RegionalFaqItemStored[];
    nearbyAreas?: unknown;
    nearbyStations?: unknown;
  };

  try {
    parsed = parseGeminiJson(text);
  } catch (e) {
    const preview =
      e instanceof GeminiJsonParseError ? e.rawPreview : text.slice(0, 80);
    return {
      ok: false,
      error: `Gemini ${model}: JSON 파싱 실패 (${preview})`,
    };
  }

  try {
    if (!parsed.regionInfo?.trim()) {
      return { ok: false, error: `Gemini ${model}: regionInfo 누락` };
    }

    const seoBlocks = normalizeSeoBlocks(parsed.seoBlocks, model);
    if ("error" in seoBlocks) return { ok: false, error: seoBlocks.error };

    const nearbyAreas = normalizeNearbyAreas(parsed.nearbyAreas, label);
    const nearbyStations = normalizeNearbyStations(parsed.nearbyStations);
    if (nearbyAreas.length < 3 || nearbyStations.length < 3) {
      return {
        ok: false,
        error: `Gemini ${model}: nearbyAreas·nearbyStations 3개 이상 필요`,
      };
    }

    return {
      ok: true,
      data: {
        regionInfo: String(parsed.regionInfo).slice(0, 400),
        metaDescription: String(
          parsed.metaDescription ?? parsed.regionInfo
        ).slice(0, 155),
        seoBlocks,
        faqItems: normalizeFaqItems(parsed.faqItems),
        nearbyAreas,
        nearbyStations,
      },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "콘텐츠 검증 실패";
    return { ok: false, error: `Gemini ${model}: ${msg}` };
  }
}

async function fetchImagePart(url: string): Promise<GeminiPart | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;

    const mime =
      res.headers.get("content-type")?.split(";")[0]?.trim() || "image/jpeg";
    if (!mime.startsWith("image/")) return null;

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 512 || buffer.length > 4 * 1024 * 1024) return null;

    return {
      inline_data: {
        mime_type: mime,
        data: buffer.toString("base64"),
      },
    };
  } catch {
    return null;
  }
}

async function callRegionalGemini(
  apiKey: string,
  model: string,
  prompt: string,
  label: string,
  academyImageUrl?: string | null
): Promise<RegionalGeminiResult> {
  const parts: GeminiPart[] = [{ text: prompt }];

  if (academyImageUrl?.startsWith("http")) {
    const imagePart = await fetchImagePart(academyImageUrl);
    if (imagePart) parts.push(imagePart);
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.85,
          maxOutputTokens: 3072,
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

  return parseRegionalContent(text, model, label);
}

function buildRegionalGeminiPrompt(input: {
  label: string;
  keyword: string;
  regionBig?: string;
  hasRecommendedAcademy: boolean;
  hasNearbyRecommendedAcademy: boolean;
  hasAcademyImage: boolean;
}): string {
  const regionLine = input.regionBig
    ? `${input.regionBig} ${input.label}`
    : input.label;

  const academyRule = input.hasRecommendedAcademy
    ? `- 지역 내 인증 추천 학원이 있음 → 소제목·본문 중 1곳 이상에서 [{recommendedAcademyName}]과 {recommendedAcademyHighlight}를 자연스럽게 언급.`
    : input.hasNearbyRecommendedAcademy
      ? `- 해당 지역 인증 추천은 없음 → 인근 {nearbyRecommendedRegion}의 [{nearbyRecommendedAcademyName}]을 통학·상담 관점에서 1회 언급 가능. {region}에 학원이 있다고 쓰지 말 것.`
      : `- 인증 추천 학원 정보 없음 → 학원 선택 가이드·비교 정보 위주.`;

  const imageRule = input.hasAcademyImage
    ? `- 첨부 학원 이미지 참고 가능(과장 금지).`
    : "";

  return `너는 네이버·구글 SEO에 최적화된 애견미용학원 지역 랜딩 글 작성 전문가다.
키워드 "${input.keyword}"에 맞는 **단일 SEO 문서**와 **근방 지역·지하철역**을 한 번에 작성한다.

[컨텍스트]
- 타깃 키워드: ${input.keyword}
- 행정·지역: ${regionLine}

[플레이스홀더 — 실제 지명·학원명으로 치환하지 말 것]
- ${REGION_VAR}, ${RECOMMENDED_ACADEMY_VAR}, ${RECOMMENDED_HIGHLIGHT_VAR}
- ${NEARBY_REGION_VAR}, ${NEARBY_ACADEMY_VAR}, ${NEARBY_HIGHLIGHT_VAR}

[작성 규칙]
1. SEO: "${input.label} 애견미용학원" 키워드를 제목·본문·FAQ에 총 5회 이상 자연스럽게 배치.
2. seoBlocks 소제목 3~4개. 각 블록: title 1개, paragraphs 2~3문장, bullets 3~5개.
3. faqItems 4개 — 수강료, 학원 선택, 국비지원·자격증, 인증 추천 관련.
4. metaDescription: 네이버 검색 스니펫용 140자 내외, 키워드 포함.
5. regionInfo: 페이지 상단 히어로 2~3문장.
6. nearbyAreas: ${input.label} 기준 통학·검색 연관 **구·동·읍·면** 5곳. 광역시·도 이름(서울, 경기 등) 제외. 기준 지역 자신 제외. 실존 지명만.
7. nearbyStations: 통학에 자주 쓰이는 **지하철·전철역** 5곳. 반드시 '역'으로 끝남. 실존 역만.
${academyRule}
${imageRule}

반드시 아래 JSON만 출력:
{
  "regionInfo": "...",
  "metaDescription": "...",
  "nearbyAreas": ["구·동1", "구·동2", "구·동3", "구·동4", "구·동5"],
  "nearbyStations": ["...역", "...역", "...역", "...역", "...역"],
  "seoBlocks": [
    { "title": "소제목", "paragraphs": ["..."], "bullets": ["..."] }
  ],
  "faqItems": [
    { "question": "...", "answer": "..." }
  ]
}`;
}

export async function generateRegionalLandingWithGemini(input: {
  label: string;
  keyword: string;
  regionBig?: string;
  recommendedAcademyName: string;
  recommendedAcademyHighlight: string;
  hasRecommendedAcademy: boolean;
  hasNearbyRecommendedAcademy: boolean;
  nearbyRecommendedAcademyName: string;
  nearbyRecommendedRegion: string;
  academyImageUrl?: string | null;
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

  const hasAcademyImage = Boolean(input.academyImageUrl?.startsWith("http"));
  const prompt = buildRegionalGeminiPrompt({
    label: input.label,
    keyword: input.keyword,
    regionBig: input.regionBig,
    hasRecommendedAcademy: input.hasRecommendedAcademy,
    hasNearbyRecommendedAcademy: input.hasNearbyRecommendedAcademy,
    hasAcademyImage,
  });
  const errors: string[] = [];

  for (const model of models) {
    for (let attempt = 1; attempt <= GEMINI_MAX_RETRIES; attempt++) {
      const result = await callRegionalGemini(
        apiKey,
        model,
        prompt,
        input.label,
        input.academyImageUrl
      );
      if (result.ok) return result;

      const isLastAttempt = attempt >= GEMINI_MAX_RETRIES;
      const shouldRetry =
        !isLastAttempt && isRetryableGeminiError(result.error);

      if (shouldRetry) {
        console.warn(
          `[Gemini regional] ${model} 시도 ${attempt}/${GEMINI_MAX_RETRIES} 실패, ${GEMINI_RETRY_DELAY_MS / 1000}초 후 재시도: ${result.error}`
        );
        await sleep(GEMINI_RETRY_DELAY_MS);
        continue;
      }

      errors.push(
        attempt > 1
          ? `${result.error} (${attempt}회 시도)`
          : result.error
      );
      break;
    }

    const lastError = errors[errors.length - 1] ?? "";
    if (lastError.includes("HTTP 404")) continue;
  }

  return {
    ok: false,
    error: errors.slice(0, 2).join(" | ") || "Gemini 호출 실패",
  };
}
