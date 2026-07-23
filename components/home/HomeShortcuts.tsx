import Link from "next/link";
import {
  Ban,
  BookOpen,
  Building2,
  Cake,
  Calculator,
  Heart,
  HelpCircle,
  Home,
  Hospital,
  PawPrint,
  Scissors,
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

function ShortcutRow({
  items,
  itemWidth,
}: {
  items: HomeShortcut[];
  itemWidth: string;
}) {
  return (
    <ul className="flex flex-nowrap items-start justify-center gap-x-2.5 overflow-x-auto pb-1 sm:gap-x-4 md:gap-x-5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <li key={item.id} className={`shrink-0 ${itemWidth}`}>
            <Link
              href={item.href}
              className="group flex flex-col items-center gap-2 text-center outline-none"
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
              <span className="px-0.5 text-xs font-semibold leading-snug tracking-tight text-foreground sm:text-sm">
                {item.label}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function HomeShortcuts() {
  return (
    <nav
      aria-label="주요 서비스"
      className="mx-auto flex w-full max-w-none flex-col gap-6 px-1 sm:gap-7"
    >
      <ShortcutRow
        items={CARE_SHORTCUTS}
        itemWidth="w-[4.85rem] sm:w-[5.75rem]"
      />
      <ShortcutRow
        items={SERVICE_SHORTCUTS}
        itemWidth="w-[4.25rem] sm:w-[5rem]"
      />
    </nav>
  );
}
