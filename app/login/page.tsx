import Link from "next/link";
import { SiteLoginForm } from "@/components/auth/SiteLoginForm";

export const metadata = {
  title: "로그인",
};

export default function LoginPage() {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-10 sm:px-6">
      <Link href="/" className="text-sm text-muted hover:text-primary">
        ← 홈으로
      </Link>
      <h1 className="mt-3 text-2xl font-black text-foreground">로그인</h1>
      <div className="mt-6">
        <SiteLoginForm />
      </div>
    </main>
  );
}
