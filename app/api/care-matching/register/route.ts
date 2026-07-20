import { NextRequest, NextResponse } from "next/server";
import { insertCareIntake } from "@/lib/care-matching/queries";
import type { CareChipType, CareSpecies } from "@/lib/types/care-intake";
import {
  MATCHING_HOUR_OPTIONS,
  parseExcludedShelters,
} from "@/lib/types/care-intake";

const SPECIES: CareSpecies[] = ["dog", "cat"];
const CHIP: CareChipType[] = [
  "none",
  "external",
  "internal",
  "both",
  "unknown",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const species = body.species as CareSpecies;
    if (!SPECIES.includes(species)) {
      return NextResponse.json(
        { error: "강아지 또는 고양이를 선택해 주세요." },
        { status: 400 }
      );
    }

    const photo_urls = Array.isArray(body.photo_urls)
      ? body.photo_urls.filter(
          (u: unknown): u is string =>
            typeof u === "string" && u.startsWith("http")
        )
      : [];

    if (photo_urls.length < 2) {
      return NextResponse.json(
        { error: "사진 2장을 등록해 주세요." },
        { status: 400 }
      );
    }

    const breed = String(body.breed ?? "").trim();
    const pet_name = String(body.pet_name ?? "").trim();
    const guardian_name = String(body.guardian_name ?? "").trim();
    const guardian_phone = String(body.guardian_phone ?? "").trim();
    const guardian_address = String(body.guardian_address ?? "").trim();

    if (
      !breed ||
      !pet_name ||
      !guardian_name ||
      !guardian_phone ||
      !guardian_address
    ) {
      return NextResponse.json(
        {
          error:
            "필수 항목(견종/묘종, 이름, 보호자 이름·연락처·주소)을 입력해 주세요.",
        },
        { status: 400 }
      );
    }

    const weightRaw = body.weight_kg;
    const weight_kg =
      weightRaw === "" || weightRaw === null || weightRaw === undefined
        ? null
        : Number(weightRaw);
    if (weight_kg !== null && (Number.isNaN(weight_kg) || weight_kg <= 0)) {
      return NextResponse.json(
        { error: "몸무게를 올바르게 입력해 주세요." },
        { status: 400 }
      );
    }

    const chip_type = CHIP.includes(body.chip_type)
      ? (body.chip_type as CareChipType)
      : "unknown";

    const portal_password = String(body.portal_password ?? "");
    if (portal_password.length < 4) {
      return NextResponse.json(
        { error: "내역 조회용 비밀번호는 4자 이상 설정해 주세요." },
        { status: 400 }
      );
    }

    const matching_hours = Number(body.matching_hours);
    if (!MATCHING_HOUR_OPTIONS.includes(matching_hours as 12 | 24 | 36 | 48)) {
      return NextResponse.json(
        { error: "매칭 대기 시간(12·24·36·48시간)을 선택해 주세요." },
        { status: 400 }
      );
    }

    const result = await insertCareIntake({
      species,
      photo_urls: photo_urls.slice(0, 2),
      breed,
      pet_name,
      weight_kg,
      age_text: body.age_text ? String(body.age_text) : null,
      gender: body.gender ? String(body.gender) : null,
      neutered:
        typeof body.neutered === "boolean" ? body.neutered : null,
      vaccinated:
        typeof body.vaccinated === "boolean" ? body.vaccinated : null,
      chip_type,
      medical_history: body.medical_history
        ? String(body.medical_history)
        : null,
      current_illness: body.current_illness
        ? String(body.current_illness)
        : null,
      personality: body.personality ? String(body.personality) : null,
      surrender_reason: body.surrender_reason
        ? String(body.surrender_reason)
        : null,
      preferred_region: null,
      excluded_shelters: parseExcludedShelters(body.excluded_shelters),
      notes: body.notes ? String(body.notes) : null,
      guardian_name,
      guardian_phone,
      guardian_address,
      portal_password,
      matching_hours: matching_hours as 12 | 24 | 36 | 48,
    });

    if (result.error || !result.data) {
      return NextResponse.json(
        { error: result.error ?? "신청 저장에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      id: result.data.id,
      message:
        "신청이 접수되었습니다. 책임 접수비 입금 확인 후 전국 사설보호소에 정보가 전달됩니다.",
    });
  } catch (e) {
    console.error("[care-matching/register]", e);
    return NextResponse.json(
      { error: "신청 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
