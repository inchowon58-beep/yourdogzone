import { NextResponse } from "next/server";
import {
  createMainAdminSessionToken,
  MAIN_ADMIN_COOKIE,
  verifyMainAdminLogin,
} from "@/lib/admin/main-auth-core";

export async function POST(request: Request) {
  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const username = body.username?.trim() ?? "";
  const password = body.password ?? "";

  if (!verifyMainAdminLogin(username, password)) {
    return NextResponse.json(
      { error: "아이디 또는 비밀번호가 올바르지 않습니다." },
      { status: 401 }
    );
  }

  const token = createMainAdminSessionToken(username);
  const res = NextResponse.json({ ok: true, username });
  res.cookies.set(MAIN_ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
  return res;
}
