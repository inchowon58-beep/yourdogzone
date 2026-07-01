import "server-only";

import { getAllAdvisoryMembers } from "@/lib/site/advisory-members-store";
import {
  CHAIRMAN_PROFILE_IMAGE,
  getChairmanConsultConfig,
} from "@/lib/site/chairman-consult";

/** 위원장 배너 — 관리자 등록 사진·환경 변수 우선 */
export async function resolveChairmanConsultConfig() {
  const config = getChairmanConsultConfig();

  const envImage =
    process.env.NEXT_PUBLIC_CHAIRMAN_PROFILE_IMAGE?.trim() ||
    process.env.CHAIRMAN_PROFILE_IMAGE?.trim();

  let profileImage = envImage || config.profileImage;

  try {
    const members = await getAllAdvisoryMembers();
    const cultureChair =
      members.find((m) => m.id === "chairman-culture") ?? members[0];
    if (cultureChair?.profilePhotoUrl?.trim()) {
      profileImage = cultureChair.profilePhotoUrl.trim();
    }
    if (cultureChair?.name?.trim()) {
      return {
        ...config,
        name: cultureChair.name.trim(),
        fullTitle: `${config.orgTitle} ${cultureChair.name.trim()}`,
        profileImage,
        kakaoUrl: cultureChair.kakaoUrl?.trim() || config.kakaoUrl,
        isEnabled: Boolean(cultureChair.kakaoUrl?.trim() || config.kakaoUrl),
      };
    }
  } catch {
    // 시드/로컬 설정 유지
  }

  return { ...config, profileImage };
}

export function isRemoteProfileImage(src: string): boolean {
  return src.startsWith("http://") || src.startsWith("https://");
}

export const CHAIRMAN_IMAGE_FALLBACK = CHAIRMAN_PROFILE_IMAGE;
