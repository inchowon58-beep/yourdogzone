/** 연맹 위원장 1:1 자문 배너 설정 (환경 변수로 교체 가능) */
export const CHAIRMAN_PROFILE_IMAGE = "/images/chairman-profile.png";

export const CHAIRMAN_PROFILE_ALT =
  "한국애견연맹 반려문화증진위원회 위원장 프로필 사진";

export const CHAIRMAN_ORG_TITLE =
  "한국애견연맹 반려문화증진위원회 위원장";

export const CHAIRMAN_DEFAULT_NAME = "조춘원";

export const CHAIRMAN_DEFAULT_KAKAO_URL =
  "https://open.kakao.com/o/skSnn1Bi";

export const CHAIRMAN_CTA_LABEL =
  "위원장님과 1:1 카톡 친구 추가하고 추천받기";

/** 가이드 배너 본문 — {region} 자리에 지역명 삽입 */
export function buildChairmanQuote(regionLabel?: string): string {
  const region = resolveChairmanQuoteRegion(regionLabel);
  return `전국 애견미용학원 정보가 너무 많아 선택이 혼란스러우시죠? 한국애견연맹 전문가의 객관적인 시선으로, 예비 수강생님의 조건에 가장 알맞은 ${region} 지역 안심 인증 미용학원을 1:1 맞춤형으로 직접 매칭해 드립니다.`;
}

/** "강남구(신사동)" → "강남구", 미전달 시 "전국" */
export function resolveChairmanQuoteRegion(regionLabel?: string): string {
  const label = regionLabel?.trim();
  if (!label) return "전국";
  const head = label.match(/^([^(（]+)/)?.[1]?.trim();
  return head || label;
}

export function getChairmanConsultConfig() {
  const name =
    process.env.NEXT_PUBLIC_CHAIRMAN_NAME?.trim() ||
    process.env.CHAIRMAN_NAME?.trim() ||
    CHAIRMAN_DEFAULT_NAME;

  const kakaoUrl =
    process.env.NEXT_PUBLIC_CHAIRMAN_KAKAO_URL?.trim() ||
    process.env.CHAIRMAN_KAKAO_URL?.trim() ||
    CHAIRMAN_DEFAULT_KAKAO_URL;

  return {
    profileImage: CHAIRMAN_PROFILE_IMAGE,
    profileAlt: CHAIRMAN_PROFILE_ALT,
    orgTitle: CHAIRMAN_ORG_TITLE,
    name,
    fullTitle: `${CHAIRMAN_ORG_TITLE} ${name}`,
    ctaLabel: CHAIRMAN_CTA_LABEL,
    kakaoUrl,
    isEnabled: Boolean(kakaoUrl),
  };
}
