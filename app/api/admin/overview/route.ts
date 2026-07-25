import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  MAIN_ADMIN_COOKIE,
  verifyMainAdminSessionToken,
} from "@/lib/admin/main-auth-core";
import { getAdminOverviewStats } from "@/lib/admin/overview";

async function requireMainAdmin(): Promise<NextResponse | null> {
  const jar = await cookies();
  const token = jar.get(MAIN_ADMIN_COOKIE)?.value;
  if (!verifyMainAdminSessionToken(token)) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  return null;
}

export async function GET() {
  const denied = await requireMainAdmin();
  if (denied) return denied;

  const stats = await getAdminOverviewStats();
  return NextResponse.json(
    { stats },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
