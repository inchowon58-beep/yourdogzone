import { NextResponse } from "next/server";
import { getVapidPublicKey, isWebPushConfigured } from "@/lib/care-matching/web-push-server";

export async function GET() {
  if (!isWebPushConfigured()) {
    return NextResponse.json(
      { configured: false, publicKey: null },
      { status: 503 }
    );
  }

  return NextResponse.json({
    configured: true,
    publicKey: getVapidPublicKey(),
  });
}
