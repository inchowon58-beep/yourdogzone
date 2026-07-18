import type { Metadata } from "next";
import { FoodDirectory } from "@/components/tools/FoodDirectory";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "강아지·고양이 먹어도 되나요",
  description:
    "초콜릿·포도·양파부터 우유·참치까지. 강아지와 고양이 등급을 구분해 위험·주의·가능 신호등과 대처법까지 안내합니다.",
  path: "/tools/food",
  ogSubtitle: "먹어도 되나요",
  keywords: [
    "강아지 먹으면 안 되는 음식",
    "고양이 먹으면 안 되는 음식",
    "강아지 초콜릿",
    "고양이 우유",
  ],
});

export default function FoodToolPage() {
  return (
    <ToolPageShell
      title="주기 전에 30초만 확인하세요"
      description="같은 음식이라도 강아지와 고양이 위험도가 다를 수 있어요. 종을 고르고, 신호등 등급·증상·대처·오해까지 한 번에 확인하세요."
    >
      <FoodDirectory />
    </ToolPageShell>
  );
}
