import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  MAIN_ADMIN_COOKIE,
  verifyMainAdminSessionToken,
} from "@/lib/admin/main-auth-core";
import {
  listShelterPartners,
  sanitizeShelterPartner,
  updateShelterPartnerStatus,
} from "@/lib/care-matching/partner-queries";
import type { ShelterPartnerStatus } from "@/lib/types/care-shelter-partner";

async function requireMainAdmin(): Promise<NextResponse | null> {
  const jar = await cookies();
  const token = jar.get(MAIN_ADMIN_COOKIE)?.value;
  if (!verifyMainAdminSessionToken(token)) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  return null;
}

export async function GET() {
  const denied = await requireMainAdmin();
  if (denied) return denied;

  const partners = await listShelterPartners();
  return NextResponse.json({
    partners: partners.map(sanitizeShelterPartner),
  });
}

export async function PATCH(request: Request) {
  const denied = await requireMainAdmin();
  if (denied) return denied;

  const body = await request.json();
  const id = String(body.id ?? "");
  const status = body.status as ShelterPartnerStatus;
  if (!id || !["pending", "approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const result = await updateShelterPartnerStatus(id, status);
  if (result.error || !result.data) {
    return NextResponse.json(
      { error: result.error ?? "변경 실패" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    partner: sanitizeShelterPartner(result.data),
  });
}
