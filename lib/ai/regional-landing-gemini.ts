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
  regionInfoNearby: string;
  nearbyIntro: string;
  metaDescription: string;
  metaDescriptionNearby: string;
  seoBlocks: RegionalSeoBlockStored[];
  seoBlocksNearby: RegionalSeoBlockStored[];
  faqItems: RegionalFaqItemStored[];
  faqItemsNearby: RegionalFaqItemStored[];
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
  model: string,
  label: string
): RegionalSeoBlockStored[] | { error: string } {
  if (!Array.isArray(blocks)) {
    return { error: `Gemini ${model}: ${label} seoBlocks 부족` };
  }
  const normalized = blocks
    .filter((b) => b?.title && Array.isArray(b.paragraphs))
    .slice(0, 3)
    .map((b) => ({
      title: String(b.title).slice(0, 120),
      paragraphs: b.paragraphs
        .map((p) => String(p).slice(0, 800))
        .filter(Boolean)
        .slice(0, 4),
      bullets: (b.bullets ?? [])
        .map((x) => String(x).slice(0, 200))
        .filter(Boolean)
        .slice(0, 6),
    }));
  if (normalized.length < 2) {
    return { error: `Gemini ${model}: ${label} seoBlocks 부족` };
  }
  return normalized;
}

function normalizeFaqItems(
  items: RegionalFaqItemStored[] | undefined
): RegionalFaqItemStored[] {
  const faqItems = (items ?? [])
    .filter((f) => f?.question && f?.answer)
    .slice(0, 5)
    .map((f) => ({
      question: String(f.question).slice(0, 120),
      answer: String(f.answer).slice(0, 500),
    }));
  if (faqItems.length >= 3) return faqItems;
  return [
    {
      question: `{region} 애견미용학원 수강료는?`,
      answer:
        "과정·등급에 따라 150만~1,200만 원대이며 국비지원 여부를 상담 시 확인하세요.",
    },
  ];
}

function normalizeGeoList(
  raw: unknown,
  asStation: boolean
): string[] {
  if (!Array.isArray(raw)) return [];
  const list = raw
    .map((x) => String(x).trim())
    .filter(Boolean)
    .slice(0, 5);
  return asStation ? list.map(formatStationName) : list;
}

function parseRegionalContent(
  text: string,
  model: string
): RegionalGeminiResult {
  let parsed: {
    regionInfo?: string;
    regionInfoNearby?: string;
    nearbyIntro?: string;
    metaDescription?: string;
    metaDescriptionNearby?: string;
    seoBlocks?: RegionalSeoBlockStored[];
    seoBlocksNearby?: RegionalSeoBlockStored[];
    faqItems?: RegionalFaqItemStored[];
    faqItemsNearby?: RegionalFaqItemStored[];
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
    if (!parsed.regionInfo?.trim() || !Array.isArray(parsed.seoBlocks)) {
      return { ok: false, error: `Gemini ${model}: 필수 필드 누락` };
    }

    if (!parsed.regionInfo?.trim() || !parsed.regionInfoNearby?.trim()) {
      return { ok: false, error: `Gemini ${model}: 필수 필드 누락` };
    }

    const seoBlocks = normalizeSeoBlocks(parsed.seoBlocks, model, "A안");
    if ("error" in seoBlocks) return { ok: false, error: seoBlocks.error };

    const seoBlocksNearby = normalizeSeoBlocks(
      parsed.seoBlocksNearby,
      model,
      "B안"
    );
    if ("error" in seoBlocksNearby) {
      return { ok: false, error: seoBlocksNearby.error };
    }

    return {
      ok: true,
      data: {
        regionInfo: String(parsed.regionInfo).slice(0, 500),
        regionInfoNearby: String(parsed.regionInfoNearby).slice(0, 500),
        nearbyIntro: String(
          parsed.nearbyIntro ??
            "근방 지역에서 함께 검색하는 애견미용학원 정보입니다."
        ).slice(0, 300),
        metaDescription: String(
          parsed.metaDescription ?? parsed.regionInfo
        ).slice(0, 160),
        metaDescriptionNearby: String(
          parsed.metaDescriptionNearby ?? parsed.regionInfoNearby
        ).slice(0, 160),
        seoBlocks,
        seoBlocksNearby,
        faqItems: normalizeFaqItems(parsed.faqItems),
        faqItemsNearby: normalizeFaqItems(parsed.faqItemsNearby),
        nearbyAreas: normalizeGeoList(parsed.nearbyAreas, false),
        nearbyStations: normalizeGeoList(parsed.nearbyStations, true),
      },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "콘텐츠 검증 실패";
    return { ok: false, error: `Gemini ${model}: ${msg}` };
  }
}

async function fetchImagePart(url: string): Promise<GeminiPart | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
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
          temperature: 0.92,
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

function buildRegionalGeminiPrompt(input: {
  label: string;
  keyword: string;
  regionBig?: string;
  nearbyLabels: string[];
  nearbyStations: string[];
  recommendedAcademyName: string;
  recommendedAcademyHighlight: string;
  hasRecommendedAcademy: boolean;
  hasNearbyRecommendedAcademy: boolean;
  nearbyRecommendedAcademyName: string;
  nearbyRecommendedRegion: string;
  hasAcademyImage: boolean;
}): string {
  const regionLine = input.regionBig
    ? `${input.regionBig} ${input.label}`
    : input.label;
  const nearby =
    input.nearbyLabels.slice(0, 5).join(", ") || "인근 구·동";
  const stations =
    input.nearbyStations.slice(0, 5).join(", ") || "인근 지하철역";

  const imageRule = input.hasAcademyImage
    ? `- 첨부된 학원 대표 이미지(실습실·시설)를 참고해 A안 글에 분위기를 자연스럽게 반영할 것. 과장·허위 묘사 금지.`
    : "";

  return `너는 전국의 우수한 애견미용학원을 발굴하고 소개하는 전문 큐레이터야.
아래 플레이스홀더만 사용해 A안(지역 내 인증추천 있을 때)·B안(해당 지역에는 없고 인근 학원 안내) 두 벌의 SEO 글을 동시에 작성해줘.

참고 컨텍스트 (치환하지 말고 플레이스홀더만 본문에 사용):
- 실제 지역 키워드: ${input.keyword}
- 행정 구역: ${regionLine}
- 인근 구·동: ${nearby}
- 인근 지하철역: ${stations}
- A안용 추천학원: ${RECOMMENDED_ACADEMY_VAR} / ${RECOMMENDED_HIGHLIGHT_VAR}
- B안용 인근 학원: ${NEARBY_REGION_VAR} / ${NEARBY_ACADEMY_VAR} / ${NEARBY_HIGHLIGHT_VAR}

[작성 규칙]
1. A안 (seoBlocks, regionInfo, faqItems):
   - '${REGION_VAR} 지역에서 특별히 인증 추천하는 [${RECOMMENDED_ACADEMY_VAR}]' 톤으로 작성.
   - ${REGION_VAR}에 학원이 있는 것처럼 자연스럽게 홍보.

2. B안 (seoBlocksNearby, regionInfoNearby, faqItemsNearby) — 매우 중요:
   - 반드시 "${REGION_VAR}에는 (아직) 인증 추천 학원이 없다" 또는 "등록되어 있지 않다"는 점을 명확히 밝힐 것.
   - 대신 "인근 ${NEARBY_REGION_VAR}에 위치한 [${NEARBY_ACADEMY_VAR}]"을 통학·상담 관점에서 소개할 것.
   - ${NEARBY_ACADEMY_VAR}가 ${REGION_VAR}에 있는 것처럼 쓰면 안 됨. "가까운 곳", "인근", "통학 가능" 표현 사용.
   - B안에는 ${RECOMMENDED_ACADEMY_VAR}를 해당 지역 학원처럼 쓰지 말 것.

3. SEO: '${input.label} 애견미용학원' 키워드를 A·B 모두에 자연스럽게 3회 이상. 지역명은 ${REGION_VAR} 플레이스홀더만 사용.
${imageRule ? `\n4. 이미지 참고:\n${imageRule}` : ""}

5. 변수 규칙: 실제 지역명·학원명으로 치환하지 말 것.

반드시 아래 JSON만 출력:
{
  "regionInfo": "A안 히어로 (2~3문장)",
  "regionInfoNearby": "B안 히어로 — {region}에는 없지만 인근 {nearbyRecommendedRegion} [{nearbyRecommendedAcademyName}] 안내",
  "nearbyIntro": "근방 구·동 안내 (80~120자)",
  "metaDescription": "A안 검색 설명 140자 내외",
  "metaDescriptionNearby": "B안 검색 설명 140자 내외",
  "seoBlocks": [ { "title": "...", "paragraphs": ["..."], "bullets": ["..."] } ],
  "seoBlocksNearby": [ { "title": "...", "paragraphs": ["..."], "bullets": ["..."] } ],
  "faqItems": [ { "question": "...", "answer": "..." } ],
  "faqItemsNearby": [ { "question": "...", "answer": "..." } ],
  "nearbyAreas": ["구·동1", "구·동2", "구·동3", "구·동4", "구·동5"],
  "nearbyStations": ["...역", "...역", "...역", "...역", "...역"]
}

seoBlocks·seoBlocksNearby 각 2~3개, faqItems·faqItemsNearby 각 4개.
nearbyAreas는 광역(서울·경기 등) 제외 실제 구·동 5곳. nearbyStations는 통학 연관 역 5곳.`;
}

export async function generateRegionalLandingWithGemini(input: {
  label: string;
  keyword: string;
  regionBig?: string;
  nearbyLabels: string[];
  nearbyStations?: string[];
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
    ...input,
    nearbyStations: input.nearbyStations ?? [],
    hasAcademyImage,
  });
  const errors: string[] = [];

  for (const model of models) {
    for (let attempt = 1; attempt <= GEMINI_MAX_RETRIES; attempt++) {
      const result = await callRegionalGemini(
        apiKey,
        model,
        prompt,
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
