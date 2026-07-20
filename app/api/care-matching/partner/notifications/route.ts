import { NextResponse } from "next/server";
import {
  listNotificationsForPartner,
  markNotificationRead,
} from "@/lib/care-matching/notification-queries";
import { getShelterPartnerIdFromSession } from "@/lib/care-matching/shelter-auth";

export async function GET() {
  const partnerId = await getShelterPartnerIdFromSession();
  if (!partnerId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const notifications = await listNotificationsForPartner(partnerId);
  return NextResponse.json({ notifications });
}

export async function PATCH(request: Request) {
  const partnerId = await getShelterPartnerIdFromSession();
  if (!partnerId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await request.json();
  const id = String(body.id ?? "");
  if (!id) {
    return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
  }

  await markNotificationRead(partnerId, id);
  return NextResponse.json({ ok: true });
}
