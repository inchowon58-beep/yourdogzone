import { NextResponse } from "next/server";
import { removePushSubscription } from "@/lib/care-matching/push-subscription-queries";
import { getShelterPartnerIdFromSession } from "@/lib/care-matching/shelter-auth";

export async function POST(request: Request) {
  const partnerId = await getShelterPartnerIdFromSession();
  if (!partnerId) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  let body: { endpoint?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const endpoint = String(body.endpoint ?? "").trim();
  if (!endpoint) {
    return NextResponse.json({ error: "endpoint가 필요합니다." }, { status: 400 });
  }

  await removePushSubscription({ partner_id: partnerId, endpoint });
  return NextResponse.json({ ok: true });
}
