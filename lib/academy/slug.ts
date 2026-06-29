const REGION_ROMANIZE: Record<string, string> = {
  서울: "seoul",
  경기: "gyeonggi",
  인천: "incheon",
  부산: "busan",
  대구: "daegu",
  광주: "gwangju",
  대전: "daejeon",
  울산: "ulsan",
  세종: "sejong",
  강원: "gangwon",
  충북: "chungbuk",
  충남: "chungnam",
  전북: "jeonbuk",
  전남: "jeonnam",
  경북: "gyeongbuk",
  경남: "gyeongnam",
  제주: "jeju",
  강남구: "gangnam",
  분당구: "bundang",
  해운대구: "haeundae",
};

function romanizeRegion(name: string): string {
  return REGION_ROMANIZE[name] ?? name.replace(/\s+/g, "").toLowerCase();
}

function slugifyName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9가-힣-]/g, "")
    .toLowerCase()
    .slice(0, 60);
}

export function generateAcademySlug(
  name: string,
  regionSmall: string,
  regionBig: string
): string {
  const region = romanizeRegion(regionSmall) || romanizeRegion(regionBig);
  const namePart = slugifyName(name) || "academy";
  const unique = Date.now().toString(36).slice(-5);
  return `${region}-${namePart}-${unique}`.replace(/--+/g, "-");
}
