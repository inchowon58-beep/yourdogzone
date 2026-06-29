import {
  BookOpen,
  Building2,
  Heart,
  HelpCircle,
  Home,
  PawPrint,
  Scissors,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";

export type ServiceItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  color: string;
};

export const SERVICES: ServiceItem[] = [
  {
    id: "academy",
    title: "애견미용학원",
    description: "전문 미용 교육 및 매칭",
    href: "/services/academy",
    icon: Scissors,
    color: "bg-violet-50 text-violet-600",
  },
  {
    id: "adoption",
    title: "강아지분양",
    description: "윤리적 분양 매칭",
    href: "/services/adoption",
    icon: Heart,
    color: "bg-rose-50 text-rose-600",
  },
  {
    id: "shelter",
    title: "강아지보호소",
    description: "유기견·구조견 정보",
    href: "/services/shelter",
    icon: Home,
    color: "bg-amber-50 text-amber-600",
  },
  {
    id: "funeral",
    title: "강아지장례식장",
    description: "장례 정보 및 예약",
    href: "/services/funeral",
    icon: Building2,
    color: "bg-slate-50 text-slate-600",
  },
  {
    id: "breeder",
    title: "브리더정보",
    description: "인증 브리더 리스트",
    href: "/services/breeder",
    icon: PawPrint,
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    id: "dognose",
    title: "견종소개",
    description: "견종 딕셔너리 & 가이드",
    href: "/dognose",
    icon: BookOpen,
    color: "bg-sky-50 text-sky-600",
  },
  {
    id: "hospital",
    title: "동물병원",
    description: "위치 기반 병원 조회",
    href: "/services/hospital",
    icon: Stethoscope,
    color: "bg-teal-50 text-teal-600",
  },
  {
    id: "qna",
    title: "강아지 Q&A",
    description: "궁금증 커뮤니티",
    href: "/qna",
    icon: HelpCircle,
    color: "bg-indigo-50 text-indigo-600",
  },
];
