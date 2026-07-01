import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  MAIN_ADMIN_COOKIE,
  verifyMainAdminSessionTokenEdge,
} from "@/lib/admin/main-auth-edge";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) return NextResponse.next();
  if (pathname === "/admin/login") return NextResponse.next();

  const token = request.cookies.get(MAIN_ADMIN_COOKIE)?.value;
  if (await verifyMainAdminSessionTokenEdge(token)) return NextResponse.next();

  const login = new URL("/admin/login", request.url);
  login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
