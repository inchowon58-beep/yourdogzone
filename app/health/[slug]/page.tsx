import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import {
  getGuideBySlug,
  relatedGuides,
  HEALTH_GUIDES,
} from "@/lib/health";
import {
  KIND_LABEL,
  SPECIES_LABEL,
  SYSTEM_LABEL,
  URGENCY_LABEL,
  URGENCY_STYLE,
} from "@/lib/health/types";
import { buildPageMetadata } from "@/lib/seo/metadata";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return HEALTH_GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) return {};
  return buildPageMetadata({
    title: `${guide.title} — ${KIND_LABEL[guide.kind]}`,
    description: guide.summary,
    path: `/health/${guide.slug}`,
    ogSubtitle: "증상·질병 백과",
    keywords: guide.keywords,
  });
}

export default async function HealthDetailPage({ params }: Props) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  const urgency = URGENCY_STYLE[guide.urgency];
  const related = relatedGuides(guide);

  return (
    <main className="w-full min-w-0 px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/health"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        백과 목록
      </Link>

      <div className={`rounded-2xl ${urgency.soft} p-5 ring-1 ring-black/5`}>
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-bold text-primary">
            {KIND_LABEL[guide.kind]}
          </span>
          <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-bold text-gray-700">
            {SYSTEM_LABEL[guide.system]}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold text-white ${urgency.badge}`}
          >
            {URGENCY_LABEL[guide.urgency]}
          </span>
        </div>
        <h1 className="mt-3 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          {guide.title}
        </h1>
        <p className={`mt-2 text-sm font-semibold ${urgency.text}`}>
          {guide.species.map((s) => SPECIES_LABEL[s]).join(" · ")}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-foreground/90">
          {guide.summary}
        </p>
      </div>

      <section className="mt-6 grid gap-4">
        <Article tone="amber" title="이런 신호가 보여요" items={guide.signals} />
        <Article tone="violet" title="의심해 볼 수 있는 원인" items={guide.causes} />
        <Article tone="emerald" title="집에서 할 수 있는 관리" items={guide.homeCare} />
        <Article
          tone="red"
          title="이럴 땐 병원으로"
          items={guide.seeVetWhen}
          numbered
        />
        <Article tone="primary" title="예방·평소 관리" items={guide.prevention} />
      </section>

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="font-bold text-foreground">함께 보면 좋아요</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/health/${r.slug}`}
                className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-muted shadow-[var(--card-shadow)] hover:text-primary"
              >
                {r.title}
              </Link>
            ))}
          </div>
        </section>
      )}

      <p className="mt-10 text-xs leading-relaxed text-muted">
        참고용 가이드입니다. 응급·이상 증상은 수의사와 상담하세요.
      </p>
    </main>
  );
}

function Article({
  title,
  items,
  tone,
  numbered,
}: {
  title: string;
  items: string[];
  tone: "amber" | "violet" | "emerald" | "red" | "primary";
  numbered?: boolean;
}) {
  const map = {
    amber: {
      title: "text-amber-700",
      item: "bg-amber-50 text-amber-950",
      num: "bg-amber-600",
    },
    violet: {
      title: "text-violet-700",
      item: "bg-violet-50 text-violet-950",
      num: "bg-violet-600",
    },
    emerald: {
      title: "text-emerald-700",
      item: "bg-emerald-50 text-emerald-950",
      num: "bg-emerald-600",
    },
    red: {
      title: "text-red-700",
      item: "bg-red-50 text-red-950",
      num: "bg-red-600",
    },
    primary: {
      title: "text-primary",
      item: "bg-primary/5 text-foreground",
      num: "bg-primary",
    },
  }[tone];

  return (
    <article className="rounded-2xl bg-white p-5 shadow-[var(--card-shadow)]">
      <h2 className={`font-bold ${map.title}`}>{title}</h2>
      <ul className="mt-3 space-y-2">
        {items.map((item, i) => (
          <li
            key={item}
            className={`flex gap-3 rounded-xl px-3 py-2.5 text-sm leading-relaxed ${map.item}`}
          >
            {numbered ? (
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${map.num}`}
              >
                {i + 1}
              </span>
            ) : (
              <span className={`mt-0.5 font-bold ${map.title}`}>•</span>
            )}
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
