import { NextResponse } from "next/server";

export function isAdminConfigured(): boolean {
  return Boolean(process.env.ACADEMY_ADMIN_SECRET?.trim());
}

export function verifyAdminSecret(request: Request): boolean {
  const secret = process.env.ACADEMY_ADMIN_SECRET?.trim();
  if (!secret) return false;

  const headerSecret = request.headers.get("x-admin-secret")?.trim();
  if (headerSecret === secret) return true;

  const auth = request.headers.get("authorization")?.trim();
  if (auth === `Bearer ${secret}`) return true;

  return false;
}

/** 서비스 관리자 시크릿 또는 메인 관리자 세션 쿠키 */
export async function verifyAdminAccess(request: Request): Promise<boolean> {
  if (verifyAdminSecret(request)) return true;

  try {
    const { cookies } = await import("next/headers");
    const { MAIN_ADMIN_COOKIE, verifyMainAdminSessionToken } = await import(
      "@/lib/admin/main-auth-core"
    );
    const jar = await cookies();
    const token = jar.get(MAIN_ADMIN_COOKIE)?.value;
    return verifyMainAdminSessionToken(token);
  } catch {
    return false;
  }
}

export async function enforceAdminAccess(
  request: Request
): Promise<NextResponse | null> {
  if (await verifyAdminAccess(request)) return null;

  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "ACADEMY_ADMIN_SECRET 환경 변수가 설정되지 않았습니다." },
      { status: 503 }
    );
  }

  return NextResponse.json(
    { error: "관리자 인증이 필요합니다." },
    { status: 401 }
  );
}
