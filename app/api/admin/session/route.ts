import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getMainAdminCredentials,
  MAIN_ADMIN_COOKIE,
  verifyMainAdminSessionToken,
} from "@/lib/admin/main-auth-core";

export async function GET() {
  const jar = await cookies();
  const token = jar.get(MAIN_ADMIN_COOKIE)?.value;
  const ok = verifyMainAdminSessionToken(token);
  return NextResponse.json({
    authenticated: ok,
    username: ok ? getMainAdminCredentials().username : null,
  });
}
