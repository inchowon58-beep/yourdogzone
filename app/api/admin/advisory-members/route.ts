import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  MAIN_ADMIN_COOKIE,
  verifyMainAdminSessionToken,
} from "@/lib/admin/main-auth-core";
import {
  deleteAdvisoryMember,
  getAllAdvisoryMembers,
  reorderAdvisoryMembers,
  upsertAdvisoryMember,
} from "@/lib/site/advisory-members-store";
import type { AdvisoryMemberInsert } from "@/lib/types/advisory-member";

async function requireMainAdmin(): Promise<NextResponse | null> {
  const jar = await cookies();
  const token = jar.get(MAIN_ADMIN_COOKIE)?.value;
  if (!verifyMainAdminSessionToken(token)) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  return null;
}

function revalidateAdvisory() {
  revalidatePath("/services/academy/advisory");
  revalidatePath("/services/academy/region/[slug]", "page");
}

export async function GET() {
  const denied = await requireMainAdmin();
  if (denied) return denied;

  const members = await getAllAdvisoryMembers({
    includeUnpublished: true,
    noCache: true,
  });
  return NextResponse.json({ members });
}

export async function POST(request: Request) {
  const denied = await requireMainAdmin();
  if (denied) return denied;

  let body: {
    action?: string;
    member?: AdvisoryMemberInsert;
    id?: string;
    orderedIds?: string[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }

  if (body.action === "delete") {
    const id = body.id?.trim();
    if (!id) {
      return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
    }
    const result = await deleteAdvisoryMember(id);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    revalidateAdvisory();
    return NextResponse.json({ ok: true });
  }

  if (body.action === "reorder") {
    const orderedIds = body.orderedIds;
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json({ error: "orderedIds가 필요합니다." }, { status: 400 });
    }
    const result = await reorderAdvisoryMembers(orderedIds);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    revalidateAdvisory();
    return NextResponse.json({ ok: true });
  }

  if (!body.member) {
    return NextResponse.json({ error: "member 데이터가 필요합니다." }, { status: 400 });
  }

  const result = await upsertAdvisoryMember(body.member);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  revalidateAdvisory();
  return NextResponse.json({ member: result.member });
}
