import { NextResponse } from "next/server";
import { getListings } from "@/lib/listings/queries";
import {
  tagsForListing,
  type ChannelId,
  type ConcernId,
  type MatchedShop,
  type ShopPriorityId,
} from "@/lib/tools/petshop-curation";

export const dynamic = "force-dynamic";

type Body = {
  regionBig?: string;
  regionAny?: boolean;
  breed?: string;
  breedAny?: boolean;
  channels?: ChannelId[];
  concerns?: ConcernId[];
  shopPriorities?: ShopPriorityId[];
};

function scoreListing(
  text: string,
  breed: string,
  channels: ChannelId[],
  priorities: ShopPriorityId[]
): number {
  let score = 0;
  const t = text.toLowerCase();
  if (breed) {
    const b = breed.toLowerCase();
    if (t.includes(b)) score += 40;
    for (const token of b.split(/\s+/).filter((x) => x.length >= 2)) {
      if (t.includes(token)) score += 8;
    }
  }
  if (channels.includes("visit") && /방문|매장|샵|펫샵/.test(text)) score += 8;
  if (channels.includes("delivery") && /배송|배달|택배|운송/.test(text))
    score += 10;
  if (channels.includes("import") && /수입/.test(text)) score += 12;
  if (channels.includes("rescue") && /책임|무료|유기|파양/.test(text))
    score += 12;
  if (
    priorities.includes("cheap") &&
    /할인|특가|저렴|가성비|프로모션/.test(text)
  )
    score += 8;
  if (priorities.includes("large_store") && /대형|종합|다양한|다수/.test(text))
    score += 8;
  if (
    priorities.includes("breed_local") &&
    breed &&
    t.includes(breed.toLowerCase())
  )
    score += 10;
  if (priorities.includes("quality") && /건강|보증|혈통|인물|우량/.test(text))
    score += 6;
  return score;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const regionAny = Boolean(body.regionAny) || !body.regionBig;
    const breed = body.breedAny ? "" : (body.breed || "").trim();
    const channels = body.channels || [];
    const concerns = body.concerns || [];
    const shopPriorities = body.shopPriorities || [];
    const region = regionAny ? undefined : body.regionBig;

    const adoption = await getListings("adoption", { region });

    const ranked = adoption
      .map((listing) => {
        const blob = [
          listing.name,
          listing.title_copy,
          listing.service_info,
          listing.extra_info,
          listing.address,
        ]
          .filter(Boolean)
          .join(" ");
        const base = listing.is_premium ? 25 : 5;
        const s = base + scoreListing(blob, breed, channels, shopPriorities);
        const shop: MatchedShop = {
          id: `listing-adoption-${listing.slug}`,
          name: listing.name,
          slug: listing.slug,
          category: "adoption",
          region: `${listing.region_big} ${listing.region_small}`.trim(),
          address: listing.address,
          phone: listing.phone,
          kakaoUrl: listing.kakao_url,
          image:
            listing.logo_image ||
            listing.gallery_images?.[0] ||
            listing.seo_hero_image ||
            null,
          tags: tagsForListing({
            isPremium: listing.is_premium,
            channels,
            concerns,
            shopPriorities,
            serviceInfo: listing.service_info,
          }),
          isPartner: false,
          isPremium: listing.is_premium,
          href: `/services/adoption/${listing.slug}`,
          matchReason: breed
            ? `${listing.region_big} 펫샵 · ‘${breed}’ 관련 안내와 매칭`
            : `${listing.region_big} 등록 분양 펫샵 매칭`,
        };
        return { shop, s };
      })
      .sort(
        (a, b) =>
          b.s - a.s || Number(b.shop.isPremium) - Number(a.shop.isPremium)
      )
      .slice(0, 6)
      .map((x) => x.shop);

    return NextResponse.json({ shops: ranked });
  } catch (e) {
    console.error("[petshop-match]", e);
    return NextResponse.json(
      { shops: [], error: "매칭 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
