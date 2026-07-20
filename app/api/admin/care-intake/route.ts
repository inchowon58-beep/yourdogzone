import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  MAIN_ADMIN_COOKIE,
  verifyMainAdminSessionToken,
} from "@/lib/admin/main-auth-core";
import {
  approveCareIntake,
  listCareIntakes,
  updateCareDeliveryStatus,
  updateCareIntakeStatus,
} from "@/lib/care-matching/queries";
import type {
  CareDeliveryStatus,
  CareIntakeStatus,
} from "@/lib/types/care-intake";
import { CARE_DELIVERY_STATUS_OPTIONS } from "@/lib/types/care-intake";

const STATUSES: CareIntakeStatus[] = [
  "pending_deposit",
  "deposit_confirmed",
  "pending_review",
  "matching",
  "matching_select",
  "matched",
  "expired",
  "cancelled",
];

async function requireMainAdmin(): Promise<NextResponse | null> {
  const jar = await cookies();
  const token = jar.get(MAIN_ADMIN_COOKIE)?.value;
  if (!verifyMainAdminSessionToken(token)) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  return null;
}

export async function GET() {
  const denied = await requireMainAdmin();
  if (denied) return denied;

  const applications = await listCareIntakes();
  return NextResponse.json({ applications });
}

export async function PATCH(request: Request) {
  const denied = await requireMainAdmin();
  if (denied) return denied;

  let body: {
    id?: number | string;
    status?: CareIntakeStatus;
    delivery_status?: CareDeliveryStatus;
    action?: "approve" | "confirm_delivery_deposit";
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  if (body.id === undefined || body.id === null) {
    return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
  }

  const numericId =
    typeof body.id === "string" && /^\d+$/.test(body.id)
      ? Number(body.id)
      : body.id;

  if (body.action === "approve") {
    const result = await approveCareIntake(numericId);
    if (result.error || !result.data) {
      return NextResponse.json(
        { error: result.error ?? "심사승인 실패" },
        { status: 400 }
      );
    }
    return NextResponse.json({ application: result.data });
  }

  if (
    body.action === "confirm_delivery_deposit" ||
    body.delivery_status === "assigning"
  ) {
    const result = await updateCareDeliveryStatus(
      numericId,
      body.delivery_status ?? "assigning"
    );
    if (result.error || !result.data) {
      return NextResponse.json(
        { error: result.error ?? "딜리버리 상태 변경 실패" },
        { status: 400 }
      );
    }
    return NextResponse.json({ application: result.data });
  }

  if (
    body.delivery_status &&
    CARE_DELIVERY_STATUS_OPTIONS.includes(body.delivery_status)
  ) {
    const result = await updateCareDeliveryStatus(
      numericId,
      body.delivery_status
    );
    if (result.error || !result.data) {
      return NextResponse.json(
        { error: result.error ?? "딜리버리 상태 변경 실패" },
        { status: 400 }
      );
    }
    return NextResponse.json({ application: result.data });
  }

  if (!body.status || !STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "유효한 status가 필요합니다." }, { status: 400 });
  }

  const result = await updateCareIntakeStatus(numericId, body.status);
  if (result.error || !result.data) {
    return NextResponse.json(
      { error: result.error ?? "상태 변경 실패" },
      { status: 500 }
    );
  }

  return NextResponse.json({ application: result.data });
}
