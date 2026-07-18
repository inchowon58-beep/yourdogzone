import type { PetSpecies } from "@/lib/tools/feeding";
import type { ReactNode } from "react";

export function SpeciesToggle({
  value,
  onChange,
}: {
  value: PetSpecies;
  onChange: (v: PetSpecies) => void;
}) {
  return (
    <div className="inline-flex rounded-2xl bg-gray-100 p-1">
      {(
        [
          { id: "dog", label: "강아지", emoji: "🐶" },
          { id: "cat", label: "고양이", emoji: "🐱" },
        ] as const
      ).map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
            value === opt.id
              ? "bg-white text-primary shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          <span className="mr-1.5">{opt.emoji}</span>
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function Callout({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "warn" | "ok" | "danger";
  title: string;
  children: ReactNode;
}) {
  const styles = {
    info: "border-primary/20 bg-primary/5 text-foreground",
    warn: "border-amber-200 bg-amber-50 text-amber-950",
    ok: "border-emerald-200 bg-emerald-50 text-emerald-950",
    danger: "border-red-200 bg-red-50 text-red-950",
  }[tone];
  const titleColor = {
    info: "text-primary",
    warn: "text-amber-700",
    ok: "text-emerald-700",
    danger: "text-red-700",
  }[tone];

  return (
    <div className={`rounded-2xl border px-4 py-3.5 text-sm leading-relaxed ${styles}`}>
      <p className={`font-bold ${titleColor}`}>{title}</p>
      <div className="mt-1.5 text-[13px] opacity-90">{children}</div>
    </div>
  );
}

export function Pill({
  children,
  color = "primary",
}: {
  children: ReactNode;
  color?: "primary" | "red" | "amber" | "emerald" | "violet" | "gray";
}) {
  const map = {
    primary: "bg-primary/10 text-primary",
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-800",
    emerald: "bg-emerald-100 text-emerald-800",
    violet: "bg-violet-100 text-violet-700",
    gray: "bg-gray-100 text-gray-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${map[color]}`}
    >
      {children}
    </span>
  );
}

export function ToolHeroImage({
  src,
  alt,
  badge,
}: {
  src: string;
  alt: string;
  badge?: string;
}) {
  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="h-44 w-full object-cover sm:h-56"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
      {badge ? (
        <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-foreground shadow-sm">
          {badge}
        </span>
      ) : null}
    </div>
  );
}
