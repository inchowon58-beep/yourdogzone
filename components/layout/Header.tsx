import Link from "next/link";
import { PawPrint } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-100/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
            <PawPrint className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <span className="text-lg font-bold tracking-tight text-foreground">
            유아독존
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/services/academy"
            className="text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            서비스
          </Link>
          <Link
            href="/dognose"
            className="text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            견종소개
          </Link>
          <Link
            href="/qna"
            className="text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            Q&A
          </Link>
        </nav>
      </div>
    </header>
  );
}
