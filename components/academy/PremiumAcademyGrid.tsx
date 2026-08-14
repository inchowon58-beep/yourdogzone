import Link from "next/link";
import { MapPin, Phone, Star } from "lucide-react";
import type { Academy } from "@/lib/types/academy";
import { getAcademyGalleryImages } from "@/lib/academy/images";
import { AcademyThumbnail } from "@/components/academy/AcademyThumbnail";
import { sanitizeSeoDetailHtml } from "@/lib/seo/sanitize-seo-html";

function galleryGridClass(count: number) {
  if (count <= 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-2";
  return "grid-cols-2 sm:grid-cols-3";
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

  if (detailHtml) {
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
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {academy.region_big} {academy.region_small}
              </span>
              {academy.phone ? (
                <a
                  href={`tel:${academy.phone.replace(/-/g, "")}`}
                  className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline"
                >
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  {academy.phone}
                </a>
              ) : null}
            </div>
          </div>
          <Link
            href={`${servicePath}/${academy.slug}`}
            className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white"
          >
            업체 상세
          </Link>
        </div>
        <div
          className="seo-detail-html space-y-3 px-4 py-5 text-sm leading-relaxed text-foreground sm:px-6 [&_a]:font-semibold [&_a]:text-primary [&_a]:underline [&_h2]:text-lg [&_h2]:font-bold [&_h3]:text-base [&_h3]:font-bold [&_img]:my-2 [&_img]:max-h-72 [&_img]:w-full [&_img]:rounded-xl [&_img]:object-cover [&_li]:ml-4 [&_li]:list-disc [&_p]:text-muted [&_strong]:text-foreground [&_ul]:space-y-1"
          dangerouslySetInnerHTML={{ __html: detailHtml }}
        />
      </article>
    );
  }

  return (
    <Link
      href={`${servicePath}/${academy.slug}`}
      className="group relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-white p-4 shadow-[var(--card-shadow)] transition-all hover:-translate-y-1 hover:shadow-[var(--card-shadow-hover)] sm:p-6"
    >
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

      <div className="mt-4 space-y-1.5 text-xs text-muted">
        <p className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {academy.region_big} {academy.region_small}
        </p>
        {academy.phone && (
          <p className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            {academy.phone}
          </p>
        )}
      </div>
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

  const rich = academies.filter((a) => a.seo_detail_html?.trim());
  const plain = academies.filter((a) => !a.seo_detail_html?.trim());
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
