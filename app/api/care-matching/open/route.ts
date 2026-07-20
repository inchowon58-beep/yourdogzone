import { NextRequest, NextResponse } from "next/server";
import { getCareMatchingViewer } from "@/lib/care-matching/matching-access";
import { listOpenCareIntakes } from "@/lib/care-matching/queries";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? "10");
  const viewer = await getCareMatchingViewer();

  const result = await listOpenCareIntakes({
    page: Number.isFinite(page) ? page : 1,
    pageSize: Number.isFinite(pageSize) ? pageSize : 10,
    partnerId: viewer.partnerId,
    partnerName: viewer.partner?.shelter_name ?? null,
    isAdmin: viewer.isAdmin,
    canViewPhotos: viewer.canViewPhotos,
  });

  return NextResponse.json({
    ...result,
    viewer: {
      isAdmin: viewer.isAdmin,
      isPartner: viewer.isPartner,
      canViewPhotos: viewer.canViewPhotos,
      canBid: viewer.canBid,
      partner: viewer.partner,
    },
  });
}
