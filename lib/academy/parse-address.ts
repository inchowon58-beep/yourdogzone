import { REGION_BIG_OPTIONS } from "@/lib/constants/regions";

const REGION_BIG_LIST = REGION_BIG_OPTIONS.filter((r) => r !== "전체");

const METRO_ALIASES: Record<string, string> = {
  서울특별시: "서울",
  부산광역시: "부산",
  대구광역시: "대구",
  인천광역시: "인천",
  광주광역시: "광주",
  대전광역시: "대전",
  울산광역시: "울산",
  세종특별자치시: "세종",
  경기도: "경기",
  강원특별자치도: "강원",
  강원도: "강원",
  충청북도: "충북",
  충청남도: "충남",
  전라북도: "전북",
  전북특별자치도: "전북",
  전라남도: "전남",
  경상북도: "경북",
  경상남도: "경남",
  제주특별자치도: "제주",
  제주도: "제주",
};

export function parseKoreanAddress(address: string): {
  region_big: string;
  region_small: string;
} {
  const trimmed = address.trim();

  for (const [alias, big] of Object.entries(METRO_ALIASES)) {
    if (trimmed.startsWith(alias)) {
      const rest = trimmed.slice(alias.length).trim();
      const small = rest.split(/\s+/)[0] ?? big;
      return { region_big: big, region_small: small };
    }
  }

  for (const big of REGION_BIG_LIST) {
    if (trimmed.includes(big)) {
      const after = trimmed.split(big).pop()?.trim() ?? "";
      const small = after.split(/\s+/)[0] || big;
      return { region_big: big, region_small: small };
    }
  }

  const firstToken = trimmed.split(/\s+/)[0] ?? "기타";
  return { region_big: "경기", region_small: firstToken };
}
