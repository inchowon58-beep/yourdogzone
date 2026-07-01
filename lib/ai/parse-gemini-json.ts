/** Gemini 응답에서 마크다운·잡문 제거 후 순수 JSON 추출 */
export function stripGeminiMarkdownFence(text: string): string {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/im, "");
  cleaned = cleaned.replace(/\s*```\s*$/m, "");
  return cleaned.trim();
}

/** 중괄호 균형을 맞춰 JSON 객체 문자열만 추출 */
export function findBalancedJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escape) escape = false;
      else if (ch === "\\") escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

function repairJson(candidate: string): string {
  return candidate.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");
}

export class GeminiJsonParseError extends Error {
  constructor(
    message: string,
    readonly rawPreview: string
  ) {
    super(message);
    this.name = "GeminiJsonParseError";
  }
}

/** 정제 → 균형 JSON 추출 → trailing comma 보정 후 파싱 */
export function parseGeminiJson<T = unknown>(rawText: string): T {
  const cleaned = stripGeminiMarkdownFence(rawText);
  const candidates: string[] = [];

  const balanced = findBalancedJsonObject(cleaned);
  if (balanced) candidates.push(balanced);
  if (cleaned && !candidates.includes(cleaned)) candidates.push(cleaned);

  let lastError: Error | null = null;

  for (const candidate of candidates) {
    for (const attempt of [candidate, repairJson(candidate)]) {
      try {
        return JSON.parse(attempt) as T;
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e));
      }
    }
  }

  const preview = cleaned.slice(0, 160).replace(/\s+/g, " ");
  throw new GeminiJsonParseError(
    lastError?.message ?? "JSON 파싱 실패",
    preview
  );
}

export const GEMINI_RETRY_DELAY_MS = 5000;
export const GEMINI_MAX_RETRIES = 3;

export function isRetryableGeminiError(error: string): boolean {
  return (
    error.includes("HTTP 503") ||
    error.includes("HTTP 429") ||
    error.includes("HTTP 500") ||
    error.includes("HTTP 502") ||
    error.includes("UNAVAILABLE") ||
    error.includes("JSON 파싱 실패") ||
    error.includes("응답 없음") ||
    error.includes("생성 중단")
  );
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
