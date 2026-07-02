import "server-only";

import {
  GEMINI_MAX_RETRIES,
  GEMINI_RETRY_DELAY_MS,
  GeminiJsonParseError,
  geminiRetryDelayMs,
  isRetryableGeminiError,
  parseGeminiJson,
  sleep,
} from "@/lib/ai/parse-gemini-json";
import { formatStationName } from "@/lib/constants/region-nearby-stations";

export type RegionalNearbyGeoResult =
  | {
      ok: true;
      data: {
        nearbyAreas: string[];
        nearbyStations: string[];
        nearbyIntro?: string;
      };
    }
  | { ok: false; error: string };

const GEO_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash-lite",
];

function normalizeAreas(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x) => String(x).trim())
    .filter(Boolean)
    .slice(0, 5);
}

function normalizeStations(raw: unknown): string[] {
  return normalizeAreas(raw).map(formatStationName);
}

function buildNearbyGeoPrompt(input: {
  label: string;
  keyword: string;
  regionBig?: string;
}): string {
  const regionLine = input.regionBig
    ? `${input.regionBig} ${input.label}`
    : input.label;

  return `한국 지역 SEO 전문가로서 아래 지역과 통학·검색 연관이 높은 근방 정보를 JSON으로만 출력하세요.

- 키워드: ${input.keyword}
- 기준 지역: ${regionLine}

규칙:
1. nearbyAreas: 광역시·도 이름(서울, 경기, 인천 등) 제외. 실제 구·동·읍·면 단위 5곳. 기준 지역 자신은 제외.
2. nearbyStations: 해당 지역 통학에 자주 쓰이는 지하철·전철 역 이름 5곳. 반드시 '역'으로 끝남.
3. nearbyIntro: 근방 구·동 안내 문장 80~120자 (한국어).
4. 실존하는 지명만. 추측이 어려우면 가장 가까운 실제 인근 지명 사용.

JSON 형식:
{
  "nearbyAreas": ["...", "...", "...", "...", "..."],
  "nearbyStations": ["...역", "...역", "...역", "...역", "...역"],
  "nearbyIntro": "..."
}`;
}

async function callNearbyGeoGemini(
  apiKey: string,
  model: string,
  prompt: string
): Promise<RegionalNearbyGeoResult> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1024,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!res.ok) {
    const detail = (await res.text()).slice(0, 200);
    return { ok: false, error: `Gemini geo ${model} HTTP ${res.status}: ${detail}` };
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) return { ok: false, error: `Gemini geo ${model}: 응답 없음` };

  try {
    const parsed = parseGeminiJson(text) as {
      nearbyAreas?: unknown;
      nearbyStations?: unknown;
      nearbyIntro?: string;
    };
    const nearbyAreas = normalizeAreas(parsed.nearbyAreas);
    const nearbyStations = normalizeStations(parsed.nearbyStations);
    if (nearbyAreas.length < 3 || nearbyStations.length < 3) {
      return { ok: false, error: `Gemini geo ${model}: 근방 데이터 부족` };
    }
    return {
      ok: true,
      data: {
        nearbyAreas,
        nearbyStations,
        nearbyIntro: parsed.nearbyIntro?.trim().slice(0, 300),
      },
    };
  } catch (e) {
    const preview =
      e instanceof GeminiJsonParseError ? e.rawPreview : text.slice(0, 80);
    return { ok: false, error: `Gemini geo ${model}: JSON 파싱 실패 (${preview})` };
  }
}

/** 근방 구·동·지하철역 — Gemini 1회 생성 후 R2에 저장해 재사용 */
export async function generateRegionalNearbyGeoWithGemini(input: {
  label: string;
  keyword: string;
  regionBig?: string;
}): Promise<RegionalNearbyGeoResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return { ok: false, error: "GEMINI_API_KEY 미설정" };

  const prompt = buildNearbyGeoPrompt(input);
  const errors: string[] = [];

  for (const model of GEO_MODELS) {
    for (let attempt = 1; attempt <= GEMINI_MAX_RETRIES; attempt++) {
      const result = await callNearbyGeoGemini(apiKey, model, prompt);
      if (result.ok) return result;

      const shouldRetry =
        attempt < GEMINI_MAX_RETRIES && isRetryableGeminiError(result.error);
      if (shouldRetry) {
        await sleep(geminiRetryDelayMs(result.error, attempt));
        continue;
      }
      errors.push(result.error);
      break;
    }
  }

  return { ok: false, error: errors[0] ?? "Gemini geo 호출 실패" };
}
