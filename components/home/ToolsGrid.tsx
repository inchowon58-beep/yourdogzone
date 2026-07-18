import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { HOME_TOOLS } from "@/lib/constants/tools";

export function ToolsGrid() {
  return (
    <section className="mb-16">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold tracking-wide text-primary">
            DAILY CARE
          </p>
          <h2 className="mt-1 text-xl font-black tracking-tight text-foreground">
            생활 속 케어존
          </h2>
          <p className="mt-1.5 text-sm text-muted">
            건강·나이·성격·먹이까지 — 지금 필요한 케어를 골라보세요
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {HOME_TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.id}
              href={tool.href}
              className="group relative flex flex-col overflow-hidden rounded-2xl bg-white p-5 shadow-[var(--card-shadow)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--card-shadow-hover)]"
            >
              <span
                className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${tool.color}`}
              >
                <Icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <h3 className="font-bold text-foreground">{tool.title}</h3>
              <p className="mt-1.5 flex-1 text-xs leading-relaxed text-muted">
                {tool.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-0.5 self-start rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                {tool.cta}
                <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
