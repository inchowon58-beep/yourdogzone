type RefinedCopy = {
  title_copy: string;
  curriculum: string;
  tuition_info: string | null;
};

export type GeminiRefineResult =
  | { ok: true; data: RefinedCopy }
  | { ok: false; error: string };

const DEFAULT_MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-2.5-flash-preview-05-20",
];

async function callGeminiModel(
  apiKey: string,
  model: string,
  prompt: string
): Promise<GeminiRefineResult> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
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
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text) as RefinedCopy;
    if (!parsed.title_copy || !parsed.curriculum) {
      return { ok: false, error: `Gemini ${model}: JSON 필드 누락` };
    }

    return {
      ok: true,
      data: {
        title_copy: String(parsed.title_copy).slice(0, 200),
        curriculum: String(parsed.curriculum).slice(0, 2000),
        tuition_info: parsed.tuition_info
          ? String(parsed.tuition_info).slice(0, 1000)
          : null,
      },
    };
  } catch {
    return { ok: false, error: `Gemini ${model}: JSON 파싱 실패` };
  }
}

export async function refineAcademyCopyWithGemini(
  name: string,
  rawDescription: string,
  address: string
): Promise<GeminiRefineResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "GEMINI_API_KEY 미설정" };
  }
  if (!rawDescription.trim()) {
    return { ok: false, error: "소개글(description) 없음" };
  }

  const envModel = process.env.GEMINI_MODEL?.trim();
  const models = [
    ...(envModel ? [envModel] : []),
    ...DEFAULT_MODELS.filter((m) => m !== envModel),
  ];

  const prompt = `당신은 반려견 포털 사이트의 에디터입니다.
아래 네이버 플레이스에서 수집한 애견미용학원 정보를 사이트 등록용으로 재작성하세요.
원문을 그대로 복사하지 말고, 사실만 유지하며 새 문장으로 작성하세요.

학원명: ${name}
주소: ${address}
원본 소개:
${rawDescription.slice(0, 4000)}

반드시 아래 JSON 형식만 출력하세요:
{
  "title_copy": "한 줄 카피 (40자 내외)",
  "curriculum": "교육 과정·특징 소개 (3~5문장)",
  "tuition_info": "수강료·혜택 안내 (없으면 null)"
}`;

  let lastError = "Gemini 호출 실패";
  for (const model of models) {
    try {
      const result = await callGeminiModel(apiKey, model, prompt);
      if (result.ok) return result;
      lastError = result.error;
      console.error("[Gemini]", result.error);
    } catch (error) {
      lastError =
        error instanceof Error ? error.message : "Gemini 알 수 없는 오류";
      console.error("[Gemini]", lastError);
    }
  }

  return { ok: false, error: lastError };
}

/** 하위 호환 — null 반환 */
export async function refineAcademyCopyWithGeminiLegacy(
  name: string,
  rawDescription: string,
  address: string
): Promise<RefinedCopy | null> {
  const result = await refineAcademyCopyWithGemini(name, rawDescription, address);
  return result.ok ? result.data : null;
}
