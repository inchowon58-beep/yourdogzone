/** 메인 관리자 임베드 모드 — 쿠키 인증, 시크릿 헤더 불필요 */
export function adminPanelHeaders(
  secret: string,
  embedded?: boolean
): Record<string, string> {
  if (embedded) return {};
  return { "x-admin-secret": secret };
}

export function adminPanelJsonHeaders(
  secret: string,
  embedded?: boolean
): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...adminPanelHeaders(secret, embedded),
  };
}
