import { NextResponse } from "next/server";
import { upsertPushSubscription } from "@/lib/care-matching/push-subscription-queries";
import { getShelterPartnerIdFromSession } from "@/lib/care-matching/shelter-auth";
import { isWebPushConfigured } from "@/lib/care-matching/web-push-server";

export async function POST(request: Request) {
  const partnerId = await getShelterPartnerIdFromSession();
  if (!partnerId) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  if (!isWebPushConfigured()) {
    return NextResponse.json(
      { error: "푸시 알림이 아직 설정되지 않았습니다." },
      { status: 503 }
    );
  }

  let body: {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const endpoint = String(body.endpoint ?? "").trim();
  const p256dh = String(body.keys?.p256dh ?? "").trim();
  const auth = String(body.keys?.auth ?? "").trim();

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json(
      { error: "구독 정보가 올바르지 않습니다." },
      { status: 400 }
    );
  }

  const result = await upsertPushSubscription({
    partner_id: partnerId,
    endpoint,
    keys: { p256dh, auth },
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
