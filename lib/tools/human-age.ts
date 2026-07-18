/** 강아지·고양이 → 사람 나이 환산 (평균 참고값) */

export type PetSpecies = "dog" | "cat";
export type DogSize = "small" | "medium" | "large";
export type AgeStage = "young" | "adult" | "senior";

const DOG_YEARLY_AFTER_TWO: Record<DogSize, number> = {
  small: 4,
  medium: 5,
  large: 6,
};

export function dogToHumanAge(years: number, size: DogSize): number {
  if (years <= 0) return 0;
  if (years <= 1) return Math.round(15 * years);
  if (years <= 2) return Math.round(15 + 9 * (years - 1));
  return Math.round(24 + (years - 2) * DOG_YEARLY_AFTER_TWO[size]);
}

/** 고양이: 1년≈15, 2년≈24, 이후 ≈4세/년 */
export function catToHumanAge(years: number): number {
  if (years <= 0) return 0;
  if (years <= 1) return Math.round(15 * years);
  if (years <= 2) return Math.round(15 + 9 * (years - 1));
  return Math.round(24 + (years - 2) * 4);
}

export function toHumanAge(
  years: number,
  species: PetSpecies,
  size: DogSize = "small"
): number {
  return species === "cat" ? catToHumanAge(years) : dogToHumanAge(years, size);
}

export function petAgeStage(
  years: number,
  species: PetSpecies,
  size: DogSize = "small"
): AgeStage {
  if (years < 1) return "young";
  if (species === "cat") {
    if (years >= 11) return "senior";
    return "adult";
  }
  const seniorAt = size === "large" ? 6 : size === "medium" ? 8 : 10;
  if (years >= seniorAt) return "senior";
  return "adult";
}

export function ageStageLabel(stage: AgeStage): string {
  switch (stage) {
    case "young":
      return "성장기 · 발달 집중 시기";
    case "adult":
      return "성년기 · 유지·활동 관리";
    case "senior":
      return "시니어 · 관절·장기 체크 권장";
  }
}

export function ageStageTips(
  stage: AgeStage,
  species: PetSpecies
): string[] {
  if (species === "cat") {
    if (stage === "young")
      return [
        "예방접종·구충 스케줄을 달력에 고정하세요",
        "성장기 전용 사료로 단백질·칼슘을 충분히",
        "높은 곳·전선 등 가정 내 위험을 미리 차단",
      ];
    if (stage === "adult")
      return [
        "체중·식욕·음수량을 2주 단위로 가볍게 기록",
        "정기 치과·혈액검사로 신장·갑상선을 점검",
        "실내 환경 풍부화(스크래처·캣타워)로 스트레스 완화",
      ];
    return [
      "신장·관절·치아 이상이 늘기 쉬운 시기입니다",
      "화장실 횟수·소변 냄새 변화를 특히 관찰하세요",
      "시니어 사료·낮은 계단/발판으로 이동을 도와주세요",
    ];
  }
  if (stage === "young")
    return [
      "사회화 골든타임을 놓치지 말고 짧은 경험을 쌓으세요",
      "성장기 사료는 품종 크기(소/중/대)에 맞게 고르세요",
      "관절이 여린 시기 — 과도한 점프·장시간 산책은 조절",
    ];
  if (stage === "adult")
    return [
      "중성화 후 대사 저하로 살이 찌기 쉬워 체중을 관리하세요",
      "치석·잇몸 염증을 막기 위해 양치·덴탈케어를 루틴화",
      "활동량에 맞춰 사료량을 2~4주마다 미세 조정하세요",
    ];
  return [
    "대형견은 시니어 진입이 더 빠른 편입니다",
    "슬개골·엉덩이·허리 통증 신호를 산책 후 꼭 확인",
    "혈액·소변 검사로 신장·간·갑상선 이상을 조기 발견",
  ];
}
