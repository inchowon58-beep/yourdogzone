import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const SHELTER_PARTNER_COOKIE = "care_shelter_session";

function sessionSecret(): string {
  return (
    process.env.CARE_SHELTER_SESSION_SECRET?.trim() ||
    process.env.MAIN_ADMIN_SESSION_SECRET?.trim() ||
    "yourdogzone-care-shelter-session"
  );
}

function signPayload(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("hex");
}

export function createShelterSessionToken(partnerId: string): string {
  const exp = Date.now() + 30 * 24 * 60 * 60 * 1000;
  const payload = JSON.stringify({ id: partnerId, exp });
  const sig = signPayload(payload);
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

export function verifyShelterSessionToken(
  token: string | undefined | null
): string | null {
  if (!token) return null;
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const dot = decoded.lastIndexOf(".");
    if (dot < 0) return null;
    const payload = decoded.slice(0, dot);
    const sig = decoded.slice(dot + 1);
    const expected = signPayload(payload);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const data = JSON.parse(payload) as { id?: string; exp?: number };
    if (!data.id || !data.exp || Date.now() > data.exp) return null;
    return data.id;
  } catch {
    return null;
  }
}

export async function getShelterPartnerIdFromSession(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(SHELTER_PARTNER_COOKIE)?.value;
  return verifyShelterSessionToken(token);
}
