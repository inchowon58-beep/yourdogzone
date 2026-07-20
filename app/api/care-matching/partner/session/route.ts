import { NextResponse } from "next/server";
import {
  getShelterPartnerById,
  sanitizeShelterPartner,
} from "@/lib/care-matching/partner-queries";
import { getShelterPartnerIdFromSession } from "@/lib/care-matching/shelter-auth";

export async function GET() {
  const partnerId = await getShelterPartnerIdFromSession();
  if (!partnerId) {
    return NextResponse.json({ partner: null });
  }
  const partner = await getShelterPartnerById(partnerId);
  if (!partner || partner.status !== "approved") {
    return NextResponse.json({ partner: null });
  }
  return NextResponse.json({ partner: sanitizeShelterPartner(partner) });
}
