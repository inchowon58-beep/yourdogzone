import { NextResponse } from "next/server";
import { requestCareDelivery } from "@/lib/care-matching/queries";
import { getCareDeliveryBankInfo } from "@/lib/types/care-intake";

export async function POST(request: Request) {
  let body: {
    id?: string | number;
    guardian_phone?: string;
    password?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  if (!body.id || !body.guardian_phone || !body.password) {
    return NextResponse.json(
      { error: "신청 정보와 비밀번호가 필요합니다." },
      { status: 400 }
    );
  }

  const result = await requestCareDelivery(
    body.id,
    body.guardian_phone,
    body.password
  );
  if (result.error || !result.data) {
    return NextResponse.json(
      { error: result.error ?? "딜리버리 신청에 실패했습니다." },
      { status: 400 }
    );
  }

  const { portal_password_hash: _, ...application } = result.data;
  return NextResponse.json({
    application,
    bank: getCareDeliveryBankInfo(),
  });
}
