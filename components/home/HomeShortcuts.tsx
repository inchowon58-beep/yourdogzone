"use client";

import Link from "next/link";
import {
  Ban,
  BookOpen,
  Building2,
  Cake,
  Calculator,
  Coffee,
  GraduationCap,
  Heart,
  HelpCircle,
  Home,
  Hospital,
  Hotel,
  PawPrint,
  Scissors,
  School,
  Sparkles,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";

export type HomeShortcut = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  tile: string;
  iconClass: string;
};

/** 1행 — 케어 도구 */
export const CARE_SHORTCUTS: HomeShortcut[] = [
  {
    id: "health",
    label: "질병백과",
    href: "/health",
    icon: Stethoscope,
    tile: "bg-teal-100",
    iconClass: "text-teal-700",
  },
  {
    id: "feeding",
    label: "급여량계산기",
    href: "/tools/feeding",
    icon: Calculator,
    tile: "bg-orange-100",
    iconClass: "text-orange-600",
  },
  {
    id: "human-age",
    label: "사람나이계산기",
    href: "/tools/human-age",
    icon: Cake,
    tile: "bg-pink-100",
    iconClass: "text-pink-600",
  },
  {
    id: "mbti",
    label: "멍BTI",
    href: "/tools/mbti",
    icon: Sparkles,
    tile: "bg-fuchsia-100",
    iconClass: "text-fuchsia-600",
  },
  {
    id: "food",
    label: "먹어도되나요",
    href: "/tools/food",
    icon: Ban,
    tile: "bg-red-100",
    iconClass: "text-red-600",
  },
];

/** 2행 — 서비스 */
export const SERVICE_SHORTCUTS: HomeShortcut[] = [
  {
    id: "academy",
    label: "미용학원",
    href: "/services/academy",
    icon: Scissors,
    tile: "bg-violet-100",
    iconClass: "text-violet-600",
  },
  {
    id: "adoption",
    label: "강아지분양",
    href: "/services/adoption",
    icon: Heart,
    tile: "bg-rose-100",
    iconClass: "text-rose-600",
  },
  {
    id: "cafe",
    label: "애견카페",
    href: "/services/cafe",
    icon: Coffee,
    tile: "bg-yellow-100",
    iconClass: "text-yellow-700",
  },
  {
    id: "hotel",
    label: "애견호텔",
    href: "/services/hotel",
    icon: Hotel,
    tile: "bg-blue-100",
    iconClass: "text-blue-700",
  },
  {
    id: "kindergarten",
    label: "애견유치원",
    href: "/services/kindergarten",
    icon: School,
    tile: "bg-lime-100",
    iconClass: "text-lime-700",
  },
  {
    id: "training",
    label: "애견훈련소",
    href: "/services/training",
    icon: GraduationCap,
    tile: "bg-orange-100",
    iconClass: "text-orange-700",
  },
  {
    id: "shelter",
    label: "보호소",
    href: "/services/shelter",
    icon: Home,
    tile: "bg-amber-100",
    iconClass: "text-amber-700",
  },
  {
    id: "funeral",
    label: "장례식장",
    href: "/services/funeral",
    icon: Building2,
    tile: "bg-stone-200",
    iconClass: "text-stone-700",
  },
  {
    id: "breeder",
    label: "브리더",
    href: "/services/breeder",
    icon: PawPrint,
    tile: "bg-emerald-100",
    iconClass: "text-emerald-700",
  },
  {
    id: "dognose",
    label: "견종소개",
    href: "/dognose",
    icon: BookOpen,
    tile: "bg-sky-100",
    iconClass: "text-sky-700",
  },
  {
    id: "hospital",
    label: "동물병원",
    href: "/services/hospital",
    icon: Hospital,
    tile: "bg-cyan-100",
    iconClass: "text-cyan-700",
  },
  {
    id: "qna",
    label: "Q&A",
    href: "/qna",
    icon: HelpCircle,
    tile: "bg-indigo-100",
    iconClass: "text-indigo-600",
  },
];

function ShortcutItem({ item }: { item: HomeShortcut }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className="group flex flex-col items-center gap-1.5 text-center outline-none sm:gap-2"
    >
      <span
        className={`flex h-14 w-14 items-center justify-center rounded-[1.15rem] ${item.tile} shadow-sm transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-primary/30 sm:h-16 sm:w-16 sm:rounded-[1.25rem]`}
      >
        <Icon
          className={`h-7 w-7 sm:h-8 sm:w-8 ${item.iconClass}`}
          strokeWidth={2}
          aria-hidden
        />
      </span>
      <span className="w-full px-0.5 text-[11px] font-semibold leading-snug tracking-tight text-foreground sm:text-sm">
        {item.label}
      </span>
    </Link>
  );
}

/** 모바일: 한 줄 4개, 남는 1~3개는 가운데 정렬 */
function ShortcutMobileRow({ items }: { items: HomeShortcut[] }) {
  return (
    <ul className="flex flex-wrap justify-center gap-y-4 sm:hidden">
      {items.map((item) => (
        <li key={item.id} className="flex w-1/4 justify-center px-0.5">
          <ShortcutItem item={item} />
        </li>
      ))}
    </ul>
  );
}

/** PC: 한 줄에 넣고, 넘치면 가운데 정렬로 줄바꿈 */
function ShortcutDesktopRow({
  items,
  itemWidth,
}: {
  items: HomeShortcut[];
  itemWidth: string;
}) {
  return (
    <ul className="flex flex-wrap items-start justify-center gap-x-4 gap-y-6 md:gap-x-5">
      {items.map((item) => (
        <li key={item.id} className={`shrink-0 ${itemWidth}`}>
          <ShortcutItem item={item} />
        </li>
      ))}
    </ul>
  );
}

export function HomeShortcuts() {
  const mobileItems = [...CARE_SHORTCUTS, ...SERVICE_SHORTCUTS];

  return (
    <nav
      aria-label="주요 서비스"
      className="mx-auto flex w-full max-w-none flex-col gap-6 px-1 sm:gap-7"
    >
      {/* 모바일: 상·하 구분 없이 연속 4열 */}
      <ShortcutMobileRow items={mobileItems} />

      {/* PC: 위 케어 도구 · 아래 서비스(여러 줄) */}
      <div className="hidden flex-col gap-7 sm:flex">
        <ShortcutDesktopRow
          items={CARE_SHORTCUTS}
          itemWidth="w-[5.75rem]"
        />
        <ShortcutDesktopRow
          items={SERVICE_SHORTCUTS}
          itemWidth="w-[5.25rem]"
        />
      </div>
    </nav>
  );
}
