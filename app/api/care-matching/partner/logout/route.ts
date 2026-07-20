import { NextResponse } from "next/server";
import { SHELTER_PARTNER_COOKIE } from "@/lib/care-matching/shelter-auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SHELTER_PARTNER_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
