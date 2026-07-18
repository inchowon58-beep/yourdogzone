import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export function ToolPageShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="w-full min-w-0 max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        홈으로
      </Link>

      <p className="text-xs font-bold tracking-wide text-primary">
        유아독존 CARE TOOLS
      </p>
      <h1 className="mt-2 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
        {title}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted sm:text-[15px]">
        {description}
      </p>

      <div className="mt-8">{children}</div>
    </main>
  );
}
