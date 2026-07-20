import { NextResponse } from "next/server";
import {
  registerShelterPartner,
  sanitizeShelterPartner,
} from "@/lib/care-matching/partner-queries";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await registerShelterPartner({
      shelter_name: String(body.shelter_name ?? ""),
      contact_name: String(body.contact_name ?? ""),
      phone: String(body.phone ?? ""),
      email: String(body.email ?? ""),
      address: String(body.address ?? ""),
      password: String(body.password ?? ""),
    });

    if (result.error || !result.data) {
      return NextResponse.json(
        { error: result.error ?? "등록에 실패했습니다." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      partner: sanitizeShelterPartner(result.data),
      message:
        "보호소 파트너 가입 신청이 접수되었습니다. 관리자 승인 후 돌봄비용을 제안할 수 있습니다.",
    });
  } catch (e) {
    console.error("[care-matching/partner/register]", e);
    return NextResponse.json(
      { error: "등록 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
