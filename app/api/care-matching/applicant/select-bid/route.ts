import { NextResponse } from "next/server";
import { selectCareIntakeBid } from "@/lib/care-matching/queries";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = body.id;
    const bid_id = String(body.bid_id ?? "");
    const guardian_phone = String(body.guardian_phone ?? "").trim();
    const password = String(body.password ?? "");

    if (!id || !bid_id || !guardian_phone || !password) {
      return NextResponse.json(
        { error: "필수 정보가 누락되었습니다." },
        { status: 400 }
      );
    }

    const result = await selectCareIntakeBid(
      id,
      guardian_phone,
      password,
      bid_id
    );
    if (result.error || !result.data) {
      return NextResponse.json(
        { error: result.error ?? "매칭에 실패했습니다." },
        { status: 400 }
      );
    }

    const { portal_password_hash: _, ...application } = result.data;
    return NextResponse.json({ application });
  } catch (e) {
    console.error("[care-matching/applicant/select-bid]", e);
    return NextResponse.json(
      { error: "처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
