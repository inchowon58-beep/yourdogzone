import { HOME_TOOLS } from "@/lib/constants/tools";
import { SERVICES } from "@/lib/constants/services";
import { HEALTH_GUIDES } from "@/lib/health";
import {
  KIND_LABEL,
  SPECIES_LABEL,
  type HealthGuide,
} from "@/lib/health/types";
import { PET_FOODS, FOOD_LEVEL_LABEL, type FoodItem } from "@/lib/tools/foods";

export type SearchHit = {
  id: string;
  title: string;
  description: string;
  href: string;
  category: string;
  categoryColor: string;
  score: number;
};

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, "");
}

function scoreMatch(query: string, fields: string[]): number {
  const q = normalize(query);
  if (!q) return 0;
  let score = 0;
  for (const raw of fields) {
    const f = normalize(raw);
    if (!f) continue;
    if (f === q) score += 100;
    else if (f.startsWith(q)) score += 60;
    else if (f.includes(q)) score += 35;
  }
  return score;
}

function foodHit(food: FoodItem, score: number): SearchHit {
  return {
    id: `food-${food.slug}`,
    title: `${food.emoji} ${food.name} — 먹어도 되나요?`,
    description: `강아지 ${FOOD_LEVEL_LABEL[food.dog]} · 고양이 ${FOOD_LEVEL_LABEL[food.cat]} · ${food.oneLiner}`,
    href: `/tools/food/${food.slug}`,
    category: "먹어도 되나요",
    categoryColor: "bg-red-50 text-red-700",
    score,
  };
}

function healthHit(guide: HealthGuide, score: number): SearchHit {
  const species = guide.species.map((s) => SPECIES_LABEL[s]).join("·");
  return {
    id: `health-${guide.slug}`,
    title: guide.title,
    description: `${KIND_LABEL[guide.kind]} · ${species} — ${guide.summary}`,
    href: `/health/${guide.slug}`,
    category: "증상·질병 백과",
    categoryColor: "bg-teal-50 text-teal-800",
    score,
  };
}

export function searchSite(query: string, limit = 40): SearchHit[] {
  const q = query.trim();
  if (!q) return [];

  const hits: SearchHit[] = [];

  for (const food of PET_FOODS) {
    const score = scoreMatch(q, [
      food.name,
      food.oneLiner,
      food.why,
      ...food.keywords,
      ...food.symptoms,
      `강아지 ${food.name}`,
      `고양이 ${food.name}`,
    ]);
    // 본문 우연 일치보다 이름·키워드 일치를 우선 (최소 점수)
    if (score >= 35) hits.push(foodHit(food, score));
  }

  for (const guide of HEALTH_GUIDES) {
    const score = scoreMatch(q, [
      guide.title,
      guide.summary,
      ...guide.keywords,
      ...guide.signals,
      ...guide.causes,
      KIND_LABEL[guide.kind],
      ...guide.species.map((s) => SPECIES_LABEL[s]),
    ]);
    if (score >= 35) hits.push(healthHit(guide, score));
  }

  for (const tool of HOME_TOOLS) {
    const score = scoreMatch(q, [
      tool.title,
      tool.description,
      tool.cta,
      tool.id,
      ...(tool.id === "food"
        ? ["먹어도 되나요", "먹으면 안 되는", "독성 음식", "금지 음식"]
        : []),
      ...(tool.id === "health"
        ? ["질병", "증상", "예방", "백과", "건강"]
        : []),
    ]);
    if (score > 0) {
      hits.push({
        id: `tool-${tool.id}`,
        title: tool.title,
        description: tool.description,
        href: tool.href,
        category: "케어존",
        categoryColor: "bg-primary/10 text-primary",
        score: score + 5,
      });
    }
  }

  for (const service of SERVICES) {
    const score = scoreMatch(q, [
      service.title,
      service.description,
      service.id,
    ]);
    if (score >= 35) {
      hits.push({
        id: `service-${service.id}`,
        title: service.title,
        description: service.description,
        href: service.href,
        category: "핵심 서비스",
        categoryColor: "bg-indigo-50 text-indigo-700",
        score,
      });
    }
  }

  hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, "ko"));
  return hits.slice(0, limit);
}
