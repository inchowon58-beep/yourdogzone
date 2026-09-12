import {
  Calculator,
  Cake,
  Sparkles,
  Ban,
  Stethoscope,
  Scale,
  HeartHandshake,
  Heart,
  Store,
  Moon,
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
    id: "love-score",
    title: "유아독존 사랑지수조회",
    description: "12문항으로 엄마사랑지수 조회 · 인스타 공유 카드",
    href: "/tools/love-score",
    cta: "조회하기",
    icon: Heart,
    color: "bg-rose-50 text-rose-600",
  },
  {
    id: "petshop-curation",
    title: "유아독존 펫샵선택도우미",
    description: "조건·성향 입력 → 맞춤 분양 가이드 · 안심제휴 매칭",
    href: "/tools/petshop-curation",
    cta: "매칭하기",
    icon: Store,
    color: "bg-indigo-50 text-indigo-700",
  },
  {
    id: "dreams",
    title: "유아독존 반려동물 꿈 해몽소",
    description: "상황별 해몽 툴 · 강아지·고양이·토끼 등 SEO 사전",
    href: "/dreams",
    cta: "해몽하기",
    icon: Moon,
    color: "bg-slate-100 text-slate-700",
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
    id: "bcs",
    title: "유아독존 비만도(BCS) 체크",
    description: "갈비·허리·배로 1~9단계 진단 + 맞춤 관리 가이드",
    href: "/tools/bcs",
    cta: "진단하기",
    icon: Scale,
    color: "bg-emerald-50 text-emerald-700",
  },
  {
    id: "pregnancy",
    title: "유아독존 임신·출산 캘린더",
    description: "교배일 → 예정일·주차별 발달·영양·준비물 체크",
    href: "/tools/pregnancy",
    cta: "캘린더 보기",
    icon: HeartHandshake,
    color: "bg-rose-50 text-rose-700",
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
