/** JS에서 읽을 수 있는 로그인 힌트 (실제 세션 토큰은 httpOnly 유지) */
export const AUTH_HINT_COOKIE = "ua_auth_hint";

export type AuthHint = {
  admin: boolean;
  partner: boolean;
};

export function serializeAuthHint(hint: AuthHint): string {
  const parts: string[] = [];
  if (hint.admin) parts.push("admin");
  if (hint.partner) parts.push("partner");
  return parts.join(",") || "";
}

export function parseAuthHint(raw: string | undefined | null): AuthHint {
  const value = (raw ?? "").trim().toLowerCase();
  if (!value) return { admin: false, partner: false };
  const parts = new Set(value.split(/[,\s]+/).filter(Boolean));
  return {
    admin: parts.has("admin") || parts.has("1") || value === "true",
    partner: parts.has("partner") || parts.has("1") || value === "true",
  };
}

export function authHintHasAny(hint: AuthHint): boolean {
  return hint.admin || hint.partner;
}
