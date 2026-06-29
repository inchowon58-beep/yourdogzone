type RefinedCopy = {
  title_copy: string;
  curriculum: string;
  tuition_info: string | null;
};

export async function refineAcademyCopyWithGemini(
  name: string,
  rawDescription: string,
  address: string
): Promise<RefinedCopy | null> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || !rawDescription.trim()) return null;

  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";
  const prompt = `당신은 반려견 포털 사이트의 에디터입니다.
아래 네이버 플레이스에서 수집한 애견미용학원 정보를 사이트 등록용으로 재작성하세요.
원문을 그대로 복사하지 말고, 사실만 유지하며 새 문장으로 작성하세요.

학원명: ${name}
주소: ${address}
원본 소개:
${rawDescription.slice(0, 4000)}

반드시 아래 JSON 형식만 출력하세요 (마크다운 없음):
{
  "title_copy": "한 줄 카피 (40자 내외)",
  "curriculum": "교육 과정·특징 소개 (3~5문장)",
  "tuition_info": "수강료·혜택 안내 (없으면 null)"
}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        }),
      }
    );

    if (!res.ok) {
      console.error("Gemini API 오류:", res.status, await res.text());
      return null;
    }

    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) return null;

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]) as RefinedCopy;
    if (!parsed.title_copy || !parsed.curriculum) return null;

    return {
      title_copy: String(parsed.title_copy).slice(0, 200),
      curriculum: String(parsed.curriculum).slice(0, 2000),
      tuition_info: parsed.tuition_info
        ? String(parsed.tuition_info).slice(0, 1000)
        : null,
    };
  } catch (error) {
    console.error("Gemini 가공 실패:", error);
    return null;
  }
}
