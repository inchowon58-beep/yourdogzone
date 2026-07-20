import { NextResponse } from "next/server";
import { insertShelterBid } from "@/lib/care-matching/bid-queries";
import { getCareIntakeById } from "@/lib/care-matching/queries";
import { getShelterPartnerById } from "@/lib/care-matching/partner-queries";
import { getShelterPartnerIdFromSession } from "@/lib/care-matching/shelter-auth";
import { isShelterNameExcluded } from "@/lib/types/care-intake";

export async function POST(request: Request) {
  const partnerId = await getShelterPartnerIdFromSession();
  if (!partnerId) {
    return NextResponse.json(
      { error: "보호소 파트너 로그인이 필요합니다." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const application_id = String(body.application_id ?? "");
    const amount = Number(body.amount);

    if (!application_id || !Number.isFinite(amount)) {
      return NextResponse.json(
        { error: "신청 ID와 제안 금액을 입력해 주세요." },
        { status: 400 }
      );
    }

    const app = await getCareIntakeById(application_id);
    if (!app || app.status !== "matching") {
      return NextResponse.json(
        { error: "현재 제안 가능한 신청이 아닙니다." },
        { status: 400 }
      );
    }

    const partner = await getShelterPartnerById(partnerId);
    if (!partner || partner.status !== "approved") {
      return NextResponse.json(
        { error: "승인된 보호소 파트너만 제안할 수 있습니다." },
        { status: 403 }
      );
    }

    if (isShelterNameExcluded(partner.shelter_name, app.excluded_shelters)) {
      return NextResponse.json(
        {
          error:
            "신청자가 제외한 보호소로 등록되어 이 건에는 제안할 수 없습니다.",
        },
        { status: 403 }
      );
    }

    const result = await insertShelterBid({
      application_id,
      partner_id: partnerId,
      amount,
    });

    if (result.error || !result.data) {
      return NextResponse.json(
        { error: result.error ?? "제안 등록에 실패했습니다." },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, bid: { amount: result.data.amount } });
  } catch (e) {
    console.error("[care-matching/partner/bid]", e);
    return NextResponse.json(
      { error: "제안 등록 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
