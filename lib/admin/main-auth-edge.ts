/** Edge Runtime(middleware)용 세션 검증 — Web Crypto API 사용 */

export const MAIN_ADMIN_COOKIE = "main_admin_session";

function sessionSecret(): string {
  return (
    process.env.MAIN_ADMIN_SESSION_SECRET?.trim() ||
    process.env.ACADEMY_ADMIN_SECRET?.trim() ||
    "yourdogzone-main-admin-session"
  );
}

function expectedUsername(): string {
  return process.env.MAIN_ADMIN_USERNAME?.trim() || "inchowon58";
}

async function hmacSha256Hex(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function decodeBase64Url(token: string): string {
  const base64 = token.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4));
  return atob(base64 + pad);
}

export async function verifyMainAdminSessionTokenEdge(
  token: string | undefined | null
): Promise<boolean> {
  if (!token) return false;
  try {
    const decoded = decodeBase64Url(token);
    const dot = decoded.lastIndexOf(".");
    if (dot < 0) return false;
    const payload = decoded.slice(0, dot);
    const sig = decoded.slice(dot + 1);
    const expected = await hmacSha256Hex(payload, sessionSecret());
    if (sig.length !== expected.length) return false;
    let ok = 0;
    for (let i = 0; i < sig.length; i++) {
      ok |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
    }
    if (ok !== 0) return false;
    const data = JSON.parse(payload) as { u?: string; exp?: number };
    if (!data.u || !data.exp || Date.now() > data.exp) return false;
    return data.u === expectedUsername();
  } catch {
    return false;
  }
}
