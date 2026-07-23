import { NextResponse } from "next/server";
import { cancelCareIntakeByApplicant } from "@/lib/care-matching/queries";
import { revalidateCareMatchingPublic } from "@/lib/care-matching/revalidate-public";

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

  const result = await cancelCareIntakeByApplicant(
    body.id,
    body.guardian_phone,
    body.password
  );
  if (result.error || !result.data) {
    return NextResponse.json(
      { error: result.error ?? "입소 취소에 실패했습니다." },
      { status: 400 }
    );
  }

  revalidateCareMatchingPublic({ freeAdoptionId: result.data.id });

  const { portal_password_hash: _, ...application } = result.data;
  return NextResponse.json({
    application,
    message:
      "입소가 취소되었습니다. 해당 아이는 무료분양 목록에 우선 노출됩니다.",
  });
}
