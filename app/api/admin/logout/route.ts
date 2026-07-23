import { NextResponse } from "next/server";
import { MAIN_ADMIN_COOKIE } from "@/lib/admin/main-auth-core";
import { clearAuthHintOnLogout } from "@/lib/auth/auth-hint-server";

export async function POST(request: Request) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(MAIN_ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  clearAuthHintOnLogout(res, "admin", request);
  return res;
}
