import { createHmac, timingSafeEqual } from "crypto";

export const MAIN_ADMIN_COOKIE = "main_admin_session";

function sessionSecret(): string {
  return (
    process.env.MAIN_ADMIN_SESSION_SECRET?.trim() ||
    process.env.ACADEMY_ADMIN_SECRET?.trim() ||
    "yourdogzone-main-admin-session"
  );
}

function signPayload(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("hex");
}

export function getMainAdminCredentials(): {
  username: string;
  password: string;
} {
  return {
    username: process.env.MAIN_ADMIN_USERNAME?.trim() || "inchowon58",
    password: process.env.MAIN_ADMIN_PASSWORD?.trim() || "yuna070207",
  };
}

export function createMainAdminSessionToken(username: string): string {
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const payload = JSON.stringify({ u: username, exp });
  const sig = signPayload(payload);
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

export function verifyMainAdminSessionToken(
  token: string | undefined | null
): boolean {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const dot = decoded.lastIndexOf(".");
    if (dot < 0) return false;
    const payload = decoded.slice(0, dot);
    const sig = decoded.slice(dot + 1);
    const expected = signPayload(payload);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
    const data = JSON.parse(payload) as { u?: string; exp?: number };
    if (!data.u || !data.exp || Date.now() > data.exp) return false;
    return data.u === getMainAdminCredentials().username;
  } catch {
    return false;
  }
}

export function verifyMainAdminLogin(
  username: string,
  password: string
): boolean {
  const creds = getMainAdminCredentials();
  return username.trim() === creds.username && password === creds.password;
}
