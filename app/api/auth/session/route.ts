import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  MAIN_ADMIN_COOKIE,
  verifyMainAdminSessionToken,
} from "@/lib/admin/main-auth-core";
import {
  SHELTER_PARTNER_COOKIE,
  verifyShelterSessionToken,
} from "@/lib/care-matching/shelter-auth";
import { getCareMatchingViewer } from "@/lib/care-matching/matching-access";

export async function GET() {
  const jar = await cookies();
  const hasAdmin = verifyMainAdminSessionToken(
    jar.get(MAIN_ADMIN_COOKIE)?.value
  );
  const hasPartner = Boolean(
    verifyShelterSessionToken(jar.get(SHELTER_PARTNER_COOKIE)?.value)
  );

  if (!hasAdmin && !hasPartner) {
    return NextResponse.json({
      admin: false,
      partner: null,
      canViewPhotos: false,
      canBid: false,
    });
  }

  const viewer = await getCareMatchingViewer();
  return NextResponse.json({
    admin: viewer.isAdmin,
    partner: viewer.partner,
    canViewPhotos: viewer.canViewPhotos,
    canBid: viewer.canBid,
  });
}
