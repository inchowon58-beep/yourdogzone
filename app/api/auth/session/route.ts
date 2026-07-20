import { NextResponse } from "next/server";
import { getCareMatchingViewer } from "@/lib/care-matching/matching-access";

export async function GET() {
  const viewer = await getCareMatchingViewer();
  return NextResponse.json({
    admin: viewer.isAdmin,
    partner: viewer.partner,
    canViewPhotos: viewer.canViewPhotos,
    canBid: viewer.canBid,
  });
}
