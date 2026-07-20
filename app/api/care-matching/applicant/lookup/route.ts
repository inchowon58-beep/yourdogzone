import { NextResponse } from "next/server";
import { lookupApplicantIntake } from "@/lib/care-matching/queries";
import { getCareDeliveryBankInfo } from "@/lib/types/care-intake";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const guardian_phone = String(body.guardian_phone ?? "").trim();
    const password = String(body.password ?? "");

    if (!guardian_phone || !password) {
      return NextResponse.json(
        { error: "연락처와 비밀번호를 입력해 주세요." },
        { status: 400 }
      );
    }

    const result = await lookupApplicantIntake(guardian_phone, password);
    if (result.error || !result.data) {
      return NextResponse.json(
        { error: result.error ?? "조회에 실패했습니다." },
        { status: 401 }
      );
    }

    const delivery = result.data.application.delivery_status;
    const bank =
      delivery && delivery !== "none" ? getCareDeliveryBankInfo() : null;

    return NextResponse.json({ ...result.data, bank });
  } catch (e) {
    console.error("[care-matching/applicant/lookup]", e);
    return NextResponse.json(
      { error: "조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
