import {
  Calculator,
  Cake,
  Sparkles,
  Ban,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";

export type ToolItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  icon: LucideIcon;
  color: string;
};

export const HOME_TOOLS: ToolItem[] = [
  {
    id: "health",
    title: "증상·질병 백과",
    description: "질병·증상·예방 가이드 — 강아지부터 이색동물까지",
    href: "/health",
    cta: "백과 보기",
    icon: Stethoscope,
    color: "bg-teal-50 text-teal-700",
  },
  {
    id: "feeding",
    title: "급여량 계산기",
    description: "강아지·고양이 체중·생애·체형으로 하루 g·kcal 산출",
    href: "/tools/feeding",
    cta: "계산하기",
    icon: Calculator,
    color: "bg-orange-50 text-orange-600",
  },
  {
    id: "human-age",
    title: "사람 나이 계산기",
    description: "환산 나이 + 생애 단계별 돌봄 팁 카드",
    href: "/tools/human-age",
    cta: "나이 보기",
    icon: Cake,
    color: "bg-pink-50 text-pink-600",
  },
  {
    id: "mbti",
    title: "멍BTI · 냥BTI",
    description: "12문항 성격 분석 + 돌봄·놀이 가이드",
    href: "/tools/mbti",
    cta: "테스트",
    icon: Sparkles,
    color: "bg-violet-50 text-violet-600",
  },
  {
    id: "food",
    title: "먹어도 되나요",
    description: "종별 신호등·증상·대처·오해까지 한곳에",
    href: "/tools/food",
    cta: "확인하기",
    icon: Ban,
    color: "bg-red-50 text-red-600",
  },
];
