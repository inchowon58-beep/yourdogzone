import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { isMainAdminAuthenticated } from "@/lib/admin/main-auth";
import { getMainAdminCredentials } from "@/lib/admin/main-auth-core";
import { MainAdminDashboard } from "@/components/admin/MainAdminDashboard";

export const metadata: Metadata = buildPageMetadata({
  title: "메인 관리자",
  description: "유아독존 통합 관리",
  path: "/admin",
  noIndex: true,
});

export default async function MainAdminPage() {
  const authed = await isMainAdminAuthenticated();
  if (!authed) redirect("/admin/login");

  const { username } = getMainAdminCredentials();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <MainAdminDashboard username={username} />
    </main>
  );
}
