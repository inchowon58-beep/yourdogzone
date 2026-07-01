/** 연맹 위원장 1:1 자문 배너 설정 (환경 변수로 교체 가능) */
export const CHAIRMAN_PROFILE_IMAGE = "/images/chairman-profile.png";

export const CHAIRMAN_ORG_TITLE =
  "한국애견연맹 반려문화증진위원회 위원장";

export const CHAIRMAN_QUOTE =
  "정보가 너무 많아 혼란스러우시죠? 전문가의 시선으로 수강생님의 상황에 가장 알맞은 안심 인증 학원을 직접 매칭해 드립니다.";

export const CHAIRMAN_CTA_LABEL =
  "위원장님과 1:1 카톡 친구 추가하고 추천받기";

export function getChairmanConsultConfig() {
  const name =
    process.env.NEXT_PUBLIC_CHAIRMAN_NAME?.trim() ||
    process.env.CHAIRMAN_NAME?.trim() ||
    "";

  const kakaoUrl =
    process.env.NEXT_PUBLIC_CHAIRMAN_KAKAO_URL?.trim() ||
    process.env.CHAIRMAN_KAKAO_URL?.trim() ||
    "";

  const displayName = name || "위원장";

  return {
    profileImage: CHAIRMAN_PROFILE_IMAGE,
    orgTitle: CHAIRMAN_ORG_TITLE,
    name: displayName,
    fullTitle: name
      ? `${CHAIRMAN_ORG_TITLE} ${name}`
      : CHAIRMAN_ORG_TITLE,
    quote: CHAIRMAN_QUOTE,
    ctaLabel: CHAIRMAN_CTA_LABEL,
    kakaoUrl,
    isEnabled: Boolean(kakaoUrl),
  };
}
