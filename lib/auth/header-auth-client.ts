"use client";

import {
  AUTH_HINT_COOKIE,
  authHintHasAny,
  parseAuthHint,
  type AuthHint,
} from "@/lib/auth/auth-hint";

const SESSION_CACHE_KEY = "ua-header-auth-session-v1";
const SESSION_CACHE_MS = 5 * 60 * 1000;

export type HeaderAuthSession = {
  admin: boolean;
  partner: {
    id: string;
    shelter_name: string;
    contact_name: string;
  } | null;
};

type CachedSession = {
  expiresAt: number;
  session: HeaderAuthSession;
};

export function readAuthHintFromDocument(): AuthHint {
  if (typeof document === "undefined") {
    return { admin: false, partner: false };
  }
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${AUTH_HINT_COOKIE}=([^;]*)`)
  );
  return parseAuthHint(match?.[1] ? decodeURIComponent(match[1]) : "");
}

export function hasAuthHintCookie(): boolean {
  return authHintHasAny(readAuthHintFromDocument());
}

export function clearAuthHintCookieClient() {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_HINT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function readCachedHeaderSession(): HeaderAuthSession | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedSession;
    if (!parsed?.expiresAt || Date.now() > parsed.expiresAt) {
      sessionStorage.removeItem(SESSION_CACHE_KEY);
      return null;
    }
    return parsed.session ?? null;
  } catch {
    return null;
  }
}

export function writeCachedHeaderSession(session: HeaderAuthSession) {
  if (typeof sessionStorage === "undefined") return;
  const payload: CachedSession = {
    expiresAt: Date.now() + SESSION_CACHE_MS,
    session,
  };
  sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(payload));
}

export function clearCachedHeaderSession() {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(SESSION_CACHE_KEY);
}
