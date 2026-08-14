import Link from "next/link";
import { Phone, Star } from "lucide-react";
import type { Academy } from "@/lib/types/academy";
import { getAcademyGalleryImages } from "@/lib/academy/images";
import { AcademyThumbnail } from "@/components/academy/AcademyThumbnail";
import { SeoHeroBanner } from "@/components/seo/SeoHeroBanner";
import { sanitizeSeoDetailHtml } from "@/lib/seo/sanitize-seo-html";
import { splitSeoHtmlAroundHero } from "@/lib/seo/seo-hero";

function galleryGridClass(count: number) {
  if (count <= 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-2";
  return "grid-cols-2 sm:grid-cols-3";
}

function homepageHref(academy: Academy, servicePath: string): string {
  const raw = academy.homepage_url?.trim();
  if (raw && /^https?:\/\//i.test(raw)) return raw;
  return `${servicePath}/${academy.slug}`;
}

function isExternalHomepage(academy: Academy): boolean {
  const raw = academy.homepage_url?.trim();
  return Boolean(raw && /^https?:\/\//i.test(raw));
}

function PremiumCard({
  academy,
  servicePath,
  premiumBadge,
}: {
  academy: Academy;
  servicePath: string;
  premiumBadge: string;
}) {
  const gallery = getAcademyGalleryImages(academy, 3);
  const detailHtml = academy.seo_detail_html
    ? sanitizeSeoDetailHtml(academy.seo_detail_html)
    : "";
  const heroImage = academy.seo_hero_image?.trim() || "";
  const href = homepageHref(academy, servicePath);
  const external = isExternalHomepage(academy);
  const hero = heroImage ? (
    <SeoHeroBanner
      imageUrl={heroImage}
      overlayColor={academy.seo_hero_overlay}
      line1={academy.seo_hero_line1}
      line2={academy.seo_hero_line2}
    />
  ) : null;
  const htmlParts = detailHtml ? splitSeoHtmlAroundHero(detailHtml) : null;

  if (detailHtml || hero) {
    return (
      <article className="overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-white shadow-[var(--card-shadow)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-100/80 px-4 py-3.5 sm:px-6">
          <div className="min-w-0">
            <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
              <Star className="h-3 w-3 fill-white" />
              {premiumBadge}
            </span>
            <h3 className="truncate text-lg font-bold text-foreground">
              {academy.name}
            </h3>
            {academy.phone ? (
              <a
                href={`tel:${academy.phone.replace(/-/g, "")}`}
                className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
              >
                <Phone className="h-3.5 w-3.5 shrink-0" />
                {academy.phone}
              </a>
            ) : null}
          </div>
          {external ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white"
            >
              홈페이지
            </a>
          ) : (
            <Link
              href={href}
              className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white"
            >
              홈페이지
            </Link>
          )}
        </div>
        <div className="space-y-4 px-4 py-5 sm:px-6">
          {htmlParts?.before ? (
            <div
              className="seo-detail-html space-y-3 text-sm leading-relaxed text-foreground [&_a]:font-semibold [&_a]:text-primary [&_a]:underline [&_h2]:text-lg [&_h2]:font-bold [&_h3]:text-base [&_h3]:font-bold [&_img]:my-2 [&_img]:max-h-72 [&_img]:w-full [&_img]:rounded-xl [&_img]:object-cover [&_li]:ml-4 [&_li]:list-disc [&_p]:text-muted [&_strong]:text-foreground [&_ul]:space-y-1"
              dangerouslySetInnerHTML={{ __html: htmlParts.before }}
            />
          ) : null}
          {hero}
          {htmlParts?.after ? (
            <div
              className="seo-detail-html space-y-3 text-sm leading-relaxed text-foreground [&_a]:font-semibold [&_a]:text-primary [&_a]:underline [&_h2]:text-lg [&_h2]:font-bold [&_h3]:text-base [&_h3]:font-bold [&_img]:my-2 [&_img]:max-h-72 [&_img]:w-full [&_img]:rounded-xl [&_img]:object-cover [&_li]:ml-4 [&_li]:list-disc [&_p]:text-muted [&_strong]:text-foreground [&_ul]:space-y-1"
              dangerouslySetInnerHTML={{ __html: htmlParts.after }}
            />
          ) : null}
        </div>
      </article>
    );
  }

  const cardInner = (
    <>
      <span className="mb-4 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
        <Star className="h-3 w-3 fill-white" />
        {premiumBadge}
      </span>

      {gallery.length > 0 && (
        <div className={`mb-4 grid gap-1.5 ${galleryGridClass(gallery.length)}`}>
          {gallery.map((url, i) => (
            <AcademyThumbnail
              key={url}
              src={url}
              alt={`${academy.name} 사진 ${i + 1}`}
              showPlaceholder={false}
              className={`aspect-[4/3] rounded-lg${i >= 2 ? " hidden sm:block" : ""}`}
            />
          ))}
        </div>
      )}

      <h3 className="text-lg font-bold text-foreground group-hover:text-primary">
        {academy.name}
      </h3>
      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">
        {academy.title_copy}
      </p>

      {academy.phone ? (
        <p className="mt-4 flex items-center gap-1.5 text-xs text-muted">
          <Phone className="h-3.5 w-3.5 shrink-0" />
          {academy.phone}
        </p>
      ) : null}
    </>
  );

  const cardClass =
    "group relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-white p-4 shadow-[var(--card-shadow)] transition-all hover:-translate-y-1 hover:shadow-[var(--card-shadow-hover)] sm:p-6";

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cardClass}
      >
        {cardInner}
      </a>
    );
  }

  return (
    <Link href={href} className={cardClass}>
      {cardInner}
    </Link>
  );
}

export function PremiumAcademyGrid({
  academies,
  servicePath = "/services/academy",
  premiumTitle = "인증 추천 학원",
  premiumBadge = "인증 추천 학원",
}: {
  academies: Academy[];
  servicePath?: string;
  premiumTitle?: string;
  premiumBadge?: string;
}) {
  if (academies.length === 0) return null;

  const rich = academies.filter(
    (a) => a.seo_detail_html?.trim() || a.seo_hero_image?.trim()
  );
  const plain = academies.filter(
    (a) => !a.seo_detail_html?.trim() && !a.seo_hero_image?.trim()
  );
  const useFullWidth = rich.length > 0;

  return (
    <section>
      <div className="mb-6 flex items-center gap-2">
        <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
        <h2 className="text-lg font-bold text-foreground">{premiumTitle}</h2>
      </div>

      {rich.length > 0 ? (
        <div className="space-y-5">
          {rich.map((academy) => (
            <PremiumCard
              key={academy.id || academy.slug}
              academy={academy}
              servicePath={servicePath}
              premiumBadge={premiumBadge}
            />
          ))}
        </div>
      ) : null}

      {plain.length > 0 ? (
        <div
          className={`grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 ${
            useFullWidth ? "mt-5" : ""
          }`}
        >
          {plain.map((academy) => (
            <PremiumCard
              key={academy.id || academy.slug}
              academy={academy}
              servicePath={servicePath}
              premiumBadge={premiumBadge}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
