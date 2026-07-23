import type { NextResponse } from "next/server";
import {
  AUTH_HINT_COOKIE,
  authHintHasAny,
  parseAuthHint,
  serializeAuthHint,
  type AuthHint,
} from "@/lib/auth/auth-hint";

function readHintFromRequest(request?: Request): AuthHint {
  if (!request) return { admin: false, partner: false };
  const raw = request.headers.get("cookie") ?? "";
  const match = raw.match(
    new RegExp(`(?:^|;\\s*)${AUTH_HINT_COOKIE}=([^;]*)`)
  );
  return parseAuthHint(match?.[1] ? decodeURIComponent(match[1]) : "");
}

function writeHintCookie(res: NextResponse, hint: AuthHint) {
  const value = serializeAuthHint(hint);
  if (!authHintHasAny(hint) || !value) {
    res.cookies.set(AUTH_HINT_COOKIE, "", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return;
  }
  res.cookies.set(AUTH_HINT_COOKIE, value, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
}

/** 로그인 성공 시 JS가 읽을 hint 쿠키에 역할 추가 */
export function setAuthHintOnLogin(
  res: NextResponse,
  role: "admin" | "partner",
  request?: Request
) {
  const hint = readHintFromRequest(request);
  if (role === "admin") hint.admin = true;
  if (role === "partner") hint.partner = true;
  writeHintCookie(res, hint);
}

/** 로그아웃 시 해당 역할만 제거 */
export function clearAuthHintOnLogout(
  res: NextResponse,
  role: "admin" | "partner",
  request?: Request
) {
  const hint = readHintFromRequest(request);
  if (role === "admin") hint.admin = false;
  if (role === "partner") hint.partner = false;
  writeHintCookie(res, hint);
}
