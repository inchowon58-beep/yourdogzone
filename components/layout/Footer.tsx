import Link from "next/link";

const FOOTER_LINKS = [
  { label: "애견미용학원", href: "/services/academy" },
  { label: "강아지분양", href: "/services/adoption" },
  { label: "강아지보호소", href: "/services/shelter" },
  { label: "동물병원", href: "/services/hospital" },
  { label: "견종소개", href: "/dognose" },
  { label: "Q&A", href: "/qna" },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-100 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div>
            <p className="text-base font-bold text-foreground">유아독존</p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
              반려동물과 함께하는 모든 순간을 위한 통합 포털.
              <br />
              신뢰할 수 있는 정보를 한곳에서 만나보세요.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-3">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <p className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          <span>© {new Date().getFullYear()} 유아독존. All rights reserved.</span>
          <span className="hidden sm:inline">·</span>
          <Link href="/feed.xml" className="hover:text-foreground">
            RSS
          </Link>
          <span>·</span>
          <Link href="/sitemap.xml" className="hover:text-foreground">
            사이트맵
          </Link>
        </p>
      </div>
    </footer>
  );
}
