import { NextResponse } from "next/server";
import { listSiteSideBanners } from "@/lib/site/side-banners-store";

export async function GET() {
  const banners = await listSiteSideBanners({ enabledOnly: true });
  return NextResponse.json({
    left: banners.filter((b) => b.slot === "left"),
    right: banners.filter((b) => b.slot === "right"),
  });
}
