import "server-only";

import type {
  RegionalFaqItemStored,
  RegionalSeoBlockStored,
} from "@/lib/types/regional-landing";
import {
  NEARBY_ACADEMY_VAR,
  NEARBY_REGION_VAR,
  RECOMMENDED_ACADEMY_VAR,
  RECOMMENDED_HIGHLIGHT_VAR,
  REGION_VAR,
} from "@/lib/academy/regional-seo-vars";

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

type GeminiPart =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } };

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
          .map((p) => String(p).slice(0, 800))
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
                  question: `{region} 애견미용학원 수강료는?`,
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
    input.nearbyLabels.slice(0, 5).join(", ") || "인근 광역 도시";

  const nearbyRule = input.hasNearbyRecommendedAcademy
    ? `- 해당 지역 인증추천학원이 없을 때: 본문에 '인근 ${NEARBY_REGION_VAR} 지역 [${NEARBY_ACADEMY_VAR}]의 경우도 통학·상담 관점에서 참고하면 좋을 것 같다'는 톤으로 자연스럽게 언급할 것.`
    : `- 해당 지역·인근 모두 인증추천학원이 없으면 ${NEARBY_ACADEMY_VAR}·${NEARBY_REGION_VAR} 플레이스홀더 문장은 생략할 것.`;

  const imageRule = input.hasAcademyImage
    ? `- 첨부된 학원 대표 이미지(실습실·시설)를 참고해 글에 분위기를 자연스럽게 반영할 것. 과장·허위 묘사 금지.`
    : "";

  return `너는 전국의 우수한 애견미용학원을 발굴하고 소개하는 전문 큐레이터야.
[지역: ${REGION_VAR}]와 [인증추천학원명: ${RECOMMENDED_ACADEMY_VAR}] 변수를 활용해서, 네이버 웹사이트 상위 노출(DIA+ 알고리즘)과 유저 전환을 모두 만족하는 독창적인 정보성 글을 생성해줘.

참고 컨텍스트 (치환하지 말고 아래 플레이스홀더만 본문에 사용):
- 실제 지역 키워드: ${input.keyword}
- 행정 구역: ${regionLine}
- 인근: ${nearby}
- 현재 인증추천학원 존재 여부: ${input.hasRecommendedAcademy ? "있음" : "없음(플레이스홀더는 그대로 유지)"}
- 인근 인증추천학원 존재 여부: ${input.hasNearbyRecommendedAcademy ? "있음" : "없음"}
- 추천학원 참고명(치환 금지, ${RECOMMENDED_ACADEMY_VAR} 사용): ${input.recommendedAcademyName}
- 강점 참고(치환 금지, ${RECOMMENDED_HIGHLIGHT_VAR} 사용): ${input.recommendedAcademyHighlight}
- 인근 추천학원 참고명(치환 금지, ${NEARBY_ACADEMY_VAR} 사용): ${input.nearbyRecommendedAcademyName || "(없음)"}
- 인근 추천 지역(치환 금지, ${NEARBY_REGION_VAR} 사용): ${input.nearbyRecommendedRegion || "(없음)"}

[작성 규칙]
1. 타깃별 만족 포인트 반영:
   - 예비 수강생(B2C): 수강료, 국비지원 여부, 자격증 합격률, 실제 실습 환경(no-cage 등)을 고르는 기준을 제시할 것.
   - 학원 원장님(B2B): 이 플랫폼이 지역 내 우수 학원을 얼마나 공정하고 돋보이게 큐레이션하고 있는지 신뢰감을 줄 것.
   - 네이버 로봇(SEO): '${input.label} 애견미용학원' 키워드 의미를 소제목·본문에 자연스럽게 3회 이상 반영할 것. 단, 본문에는 반드시 ${REGION_VAR} 플레이스홀더 문자열을 사용하고 실제 지역명을 직접 쓰지 말 것.

2. 인증추천학원 자연스러운 스토리텔링 홍보 (핵심):
   - 본문 중간에 '${REGION_VAR} 지역에서 특별히 인증 추천하는 [${RECOMMENDED_ACADEMY_VAR}]'을 자연스럽게 언급할 것.
   - 예시 톤: '수많은 학원 중에서도 ${REGION_VAR}의 [${RECOMMENDED_ACADEMY_VAR}]의 경우, 수강생들이 가장 중요하게 생각하는 [${RECOMMENDED_HIGHLIGHT_VAR}] 등의 기준을 높은 수준으로 충족하고 있어 신뢰할 만합니다.'
   - 강요하지 않고 공신력 있게 작성.

3. 인근 지역 추천학원 안내:
${nearbyRule}

4. 가독성:
   - seoBlocks의 title은 h2/h3에 해당하는 소제목 문구로 작성.
   - bullets는 핵심 요약(• 스타일 문장).
${imageRule ? `\n5. 이미지 참고:\n${imageRule}` : ""}

6. 변수 규칙 (매우 중요):
   - 모든 문장에서 지역은 ${REGION_VAR}, 학원명은 ${RECOMMENDED_ACADEMY_VAR}, 강점은 ${RECOMMENDED_HIGHLIGHT_VAR}, 인근 지역은 ${NEARBY_REGION_VAR}, 인근 학원명은 ${NEARBY_ACADEMY_VAR} 문자열을 그대로 포함.
   - 실제 지역명·학원명으로 치환하지 말 것. 나중에 시스템이 동적으로 바인딩함.

반드시 아래 JSON만 출력:
{
  "regionInfo": "히어로 소개 (2~3문장, ${REGION_VAR} 포함)",
  "nearbyIntro": "근방 안내 (80~120자)",
  "metaDescription": "검색 설명 140자 내외, ${REGION_VAR}·${RECOMMENDED_ACADEMY_VAR} 포함",
  "seoBlocks": [
    {
      "title": "h2급 소제목 (${REGION_VAR} 애견미용학원 키워드 포함)",
      "paragraphs": ["문단1", "문단2"],
      "bullets": ["체크1", "체크2", "체크3", "체크4"]
    }
  ],
  "faqItems": [
    { "question": "질문", "answer": "답변" }
  ]
}

seoBlocks 2~3개, faqItems 4개. 매번 다른 관점·문체로 작성.`;
}

export async function generateRegionalLandingWithGemini(input: {
  label: string;
  keyword: string;
  regionBig?: string;
  nearbyLabels: string[];
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
  const prompt = buildRegionalGeminiPrompt({ ...input, hasAcademyImage });
  const errors: string[] = [];

  for (const model of models) {
    const result = await callRegionalGemini(
      apiKey,
      model,
      prompt,
      input.academyImageUrl
    );
    if (result.ok) return result;
    errors.push(result.error);
    if (result.error.includes("HTTP 404")) continue;
  }

  return {
    ok: false,
    error: errors.slice(0, 2).join(" | ") || "Gemini 호출 실패",
  };
}
