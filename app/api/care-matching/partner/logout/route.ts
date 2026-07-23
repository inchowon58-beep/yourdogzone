import { NextResponse } from "next/server";
import { SHELTER_PARTNER_COOKIE } from "@/lib/care-matching/shelter-auth";
import { clearAuthHintOnLogout } from "@/lib/auth/auth-hint-server";

export async function POST(request: Request) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SHELTER_PARTNER_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  clearAuthHintOnLogout(res, "partner", request);
  return res;
}
