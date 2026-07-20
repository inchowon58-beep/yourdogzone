import { NextResponse } from "next/server";
import {
  sanitizeShelterPartner,
  verifyShelterPartnerLogin,
} from "@/lib/care-matching/partner-queries";
import {
  SHELTER_PARTNER_COOKIE,
  createShelterSessionToken,
} from "@/lib/care-matching/shelter-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const phone = String(body.phone ?? "").trim();
    const password = String(body.password ?? "");

    const partner = await verifyShelterPartnerLogin(phone, password);
    if (!partner) {
      return NextResponse.json(
        { error: "연락처 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    if (partner.status !== "approved") {
      return NextResponse.json(
        {
          error:
            partner.status === "pending"
              ? "관리자 승인 대기 중입니다. 승인 후 로그인할 수 있습니다."
              : "승인되지 않은 계정입니다.",
        },
        { status: 403 }
      );
    }

    const token = createShelterSessionToken(partner.id);
    const res = NextResponse.json({
      ok: true,
      partner: sanitizeShelterPartner(partner),
    });
    res.cookies.set(SHELTER_PARTNER_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });
    return res;
  } catch (e) {
    console.error("[care-matching/partner/login]", e);
    return NextResponse.json(
      { error: "로그인 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
