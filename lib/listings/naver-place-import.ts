import "server-only";

import { parseKoreanAddress } from "@/lib/academy/parse-address";
import { bulkRegisterAcademy } from "@/lib/academy/bulk-register";
import type { BulkRegisterItemResult } from "@/lib/academy/bulk-register";
import { bulkRegisterListing } from "@/lib/listings/bulk-register";
import type { BulkListingItemResult } from "@/lib/listings/bulk-register";
import { getListingConfig } from "@/lib/listings/config";
import { pickBestPhone } from "@/lib/listings/phone";
import type { ListingCategory, NaverBlogReview } from "@/lib/types/listing";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

export type NaverPlaceCandidate = {
  placeId: string;
  name: string;
  address: string;
  phone: string | null;
  thumb: string | null;
  category: string | null;
  naverPlaceUrl: string;
  rating?: number | null;
  reviewCount?: number | null;
};

export type NaverPlaceDetail = {
  placeId: string;
  name: string;
  address: string;
  phone: string | null;
  description: string | null;
  imageUrls: string[];
  naverPlaceUrl: string;
  rating: number | null;
  reviewCount: number | null;
  blogReviews: NaverBlogReview[];
};

function placeUrl(placeId: string, name?: string): string {
  const q = name ? encodeURIComponent(name) : "";
  if (q) {
    return `https://map.naver.com/p/search/${q}/place/${placeId}`;
  }
  return `https://map.naver.com/p/place/${placeId}`;
}

/** 플레이스 URL 또는 숫자 ID에서 placeId 추출 */
export function extractNaverPlaceId(input: string): string | null {
  const text = input.trim();
  if (!text) return null;
  if (/^\d{5,}$/.test(text)) return text;
  const fromPath = text.match(/place\/(\d{5,})/i);
  if (fromPath?.[1]) return fromPath[1];
  const fromQuery = text.match(/[?&]id=(\d{5,})/i);
  if (fromQuery?.[1]) return fromQuery[1];
  return null;
}

async function fetchJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "application/json, text/plain, */*",
        Referer: "https://map.naver.com/",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function pickString(...values: unknown[]): string {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function pickNumber(...values: unknown[]): number | null {
  for (const v of values) {
    if (typeof v === "number" && Number.isFinite(v) && v > 0) return v;
    if (typeof v === "string" && v.trim()) {
      const n = Number(v.replace(/,/g, ""));
      if (Number.isFinite(n) && n > 0) return n;
    }
  }
  return null;
}

function extractRatingFields(item: Record<string, unknown>): {
  rating: number | null;
  reviewCount: number | null;
} {
  const rating = pickNumber(
    item.visitorReviewScore,
    item.averageScore,
    item.avgRating,
    item.score,
    item.rating
  );
  const reviewCount = pickNumber(
    item.visitorReviewCount,
    item.totalReviewCount,
    item.reviewCount,
    item.visitorReviewsTotal
  );
  return {
    rating: rating != null ? Math.min(5, Math.round(rating * 10) / 10) : null,
    reviewCount: reviewCount != null ? Math.round(reviewCount) : null,
  };
}

function extractCandidatesFromSearch(data: unknown): NaverPlaceCandidate[] {
  const root = asRecord(data);
  if (!root) return [];

  const result = asRecord(root.result) ?? root;
  const place = asRecord(result.place);
  const list =
    (Array.isArray(place?.list) && place.list) ||
    (Array.isArray(result.place) && result.place) ||
    (Array.isArray(result.items) && result.items) ||
    (Array.isArray(root.place) && root.place) ||
    [];

  const out: NaverPlaceCandidate[] = [];
  for (const raw of list) {
    const item = asRecord(raw);
    if (!item) continue;
    const placeId = pickString(item.id, item.placeId, item.sid);
    const name = pickString(item.name, item.title, item.businessName);
    if (!placeId || !name) continue;
    const address = pickString(
      item.roadAddress,
      item.address,
      item.fullAddress,
      item.jibunAddress
    );
    const phone =
      pickBestPhone(item.virtualTel, item.tel, item.phone) || null;
    const thumbRaw =
      pickString(
        item.thumUrl,
        item.thumbnail,
        item.imageUrl,
        asRecord(item.imageInfo)?.url
      ) || null;
    const thumb = thumbRaw && isLikelyPlacePhoto(thumbRaw) ? thumbRaw : null;
    const category =
      pickString(item.category, item.bizhourInfo, item.categoryCodeName) ||
      null;
    const { rating, reviewCount } = extractRatingFields(item);
    out.push({
      placeId,
      name,
      address: address || "주소 미확인",
      phone,
      thumb,
      category,
      naverPlaceUrl: placeUrl(placeId, name),
      rating,
      reviewCount,
    });
  }
  return out;
}

/** 네이버 지도 검색 (HTTP) — UI/캡차 변경 시 실패할 수 있음. URL·ID 붙여넣기 지원 */
export async function searchNaverPlaces(
  query: string
): Promise<{ candidates: NaverPlaceCandidate[]; error?: string }> {
  const q = query.trim();
  if (!q) return { candidates: [], error: "업체명 또는 네이버 플레이스 URL을 입력해 주세요." };

  const directId = extractNaverPlaceId(q);
  if (directId) {
    const { detail, error } = await fetchNaverPlaceDetail(directId);
    if (!detail) {
      return {
        candidates: [],
        error:
          error ??
          "플레이스 ID/URL로 상세를 불러오지 못했습니다. URL을 확인해 주세요.",
      };
    }
    return {
      candidates: [
        {
          placeId: detail.placeId,
          name: detail.name,
          address: detail.address,
          phone: detail.phone,
          thumb: detail.imageUrls[0] ?? null,
          category: null,
          naverPlaceUrl: detail.naverPlaceUrl,
          rating: detail.rating,
          reviewCount: detail.reviewCount,
        },
      ],
    };
  }

  const encoded = encodeURIComponent(q);
  const urls = [
    `https://map.naver.com/p/api/search/allSearch?query=${encoded}&type=all&searchCoord=126.9780%3B37.5665&boundary=`,
  ];

  for (const url of urls) {
    const data = await fetchJson(url);
    const root = asRecord(data);
    if (root && asRecord(root.result)?.ncaptcha) {
      return {
        candidates: [],
        error:
          "네이버 검색이 캡차로 차단되었습니다. 네이버지도에서 업체를 연 뒤 주소창 URL(또는 place/숫자)을 붙여넣고 다시 검색해 주세요.",
      };
    }
    const candidates = extractCandidatesFromSearch(data).slice(0, 12);
    if (candidates.length > 0) {
      return { candidates };
    }
  }

  return {
    candidates: [],
    error:
      "네이버에서 업체를 찾지 못했습니다. 네이버지도 플레이스 URL을 붙여넣거나 수동 등록을 이용해 주세요.",
  };
}

/** 네이버 지도 예약 배너·OG 기본이미지 등 업체 사진이 아닌 URL 제외 */
export function isLikelyPlacePhoto(url: string): boolean {
  const raw = url.trim();
  if (!raw.startsWith("http://") && !raw.startsWith("https://")) return false;
  const lower = raw.toLowerCase();

  if (
    /booking|reservation|혜택|promo|banner|og_default|placeholder|map\.naver\.com\/assets|\/static\/map|\/static\/img/i.test(
      lower
    )
  ) {
    return false;
  }
  if (/ssl\.pstatic\.net\/static/i.test(lower)) return false;

  if (
    /ldb-phinf\.pstatic\.net|search\.pstatic\.net|blogfiles\.pstatic\.net|postfiles\.pstatic\.net|phinf\.pstatic\.net/i.test(
      lower
    )
  ) {
    return true;
  }

  if (/pstatic\.net/i.test(lower) && !/\/static\//i.test(lower)) return true;

  if (/\.(jpe?g|png|webp|gif)(\?|$)/i.test(lower)) return true;

  return false;
}

function extractImagesFromDetail(data: unknown): string[] {
  const root = asRecord(data);
  if (!root) return [];
  const urls: string[] = [];
  const push = (u: unknown) => {
    if (typeof u !== "string" || !u.startsWith("http") || urls.includes(u)) return;
    if (!isLikelyPlacePhoto(u)) return;
    urls.push(u);
  };

  const images = root.images ?? root.photos ?? root.photoList;
  if (Array.isArray(images)) {
    for (const img of images) {
      if (typeof img === "string") push(img);
      else {
        const rec = asRecord(img);
        push(rec?.url ?? rec?.originUrl ?? rec?.thumbnail);
      }
    }
  }

  const detail = asRecord(root.place) ?? asRecord(root.business) ?? root;
  push(detail?.thumUrl);
  push(detail?.imageUrl);
  const imageUrls = detail?.imageUrls;
  if (Array.isArray(imageUrls)) {
    for (const u of imageUrls) push(u);
  }

  return urls.slice(0, 6);
}

function stripHtml(text: string): string {
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeBlogReview(raw: Record<string, unknown>): NaverBlogReview | null {
  const title = pickString(
    raw.title,
    raw.blogTitle,
    raw.name,
    raw.headline
  );
  const bodyRaw = pickString(
    raw.body,
    raw.contents,
    raw.content,
    raw.description,
    raw.blogContents,
    raw.summary
  );
  if (!title && !bodyRaw) return null;
  const body = stripHtml(bodyRaw).slice(0, 160);
  const url =
    pickString(
      raw.url,
      raw.landingUrl,
      raw.blogUrl,
      raw.link,
      raw.permalink
    ) || null;
  return {
    title: title || "네이버 블로그 리뷰",
    body: body || title,
    url,
  };
}

function extractBlogReviewsFromUnknown(
  data: unknown,
  limit = 5
): NaverBlogReview[] {
  const out: NaverBlogReview[] = [];
  const seen = new Set<string>();

  const push = (rec: Record<string, unknown> | null) => {
    if (!rec || out.length >= limit) return;
    const review = normalizeBlogReview(rec);
    if (!review) return;
    const key = `${review.title}|${review.url ?? ""}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(review);
  };

  const walk = (value: unknown, depth = 0) => {
    if (out.length >= limit || depth > 6) return;
    if (Array.isArray(value)) {
      for (const item of value) {
        const rec = asRecord(item);
        if (rec && (rec.title || rec.blogTitle || rec.contents || rec.body)) {
          push(rec);
        } else {
          walk(item, depth + 1);
        }
        if (out.length >= limit) return;
      }
      return;
    }
    const rec = asRecord(value);
    if (!rec) return;
    for (const [k, v] of Object.entries(rec)) {
      if (/blog/i.test(k) && (Array.isArray(v) || typeof v === "object")) {
        walk(v, depth + 1);
      }
    }
  };

  walk(data);
  return out.slice(0, limit);
}

/** 등록 시에만 호출 — 페이지 조회에서는 사용하지 않음 */
export async function fetchNaverBlogReviews(
  placeId: string,
  limit = 5
): Promise<NaverBlogReview[]> {
  const id = placeId.trim();
  if (!id) return [];

  const graphqlBodies = [
    {
      operationName: "getBlogList",
      query: `query getBlogList($input: BlogListInput) {
        blogs(input: $input) {
          items {
            title
            contents
            landingUrl
            authorName
          }
        }
      }`,
      variables: {
        input: {
          businessId: id,
          businessType: "place",
          page: 1,
          display: limit,
        },
      },
    },
    {
      operationName: "getFsasReviews",
      query: `query getFsasReviews($input: FsasReviewsInput) {
        fsasReviews(input: $input) {
          items {
            title: name
            body
            url: landingUrl
          }
        }
      }`,
      variables: {
        input: {
          businessId: id,
          businessType: "place",
          page: 1,
          display: limit,
          deviceType: "mobile",
          query: null,
        },
      },
    },
  ];

  const endpoints = [
    "https://pcmap-api.place.naver.com/graphql",
    "https://api.place.naver.com/graphql",
  ];

  for (const endpoint of endpoints) {
    for (const body of graphqlBodies) {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "User-Agent": UA,
            Accept: "application/json",
            "Content-Type": "application/json",
            Referer: `https://m.place.naver.com/place/${id}`,
          },
          body: JSON.stringify(body),
          cache: "no-store",
          signal: AbortSignal.timeout(10_000),
        });
        if (!res.ok) continue;
        const data = await res.json();
        const reviews = extractBlogReviewsFromUnknown(data, limit);
        if (reviews.length > 0) return reviews;
      } catch {
        // try next
      }
    }
  }

  // HTML/JSON fallback — 한 번만
  try {
    const res = await fetch(
      `https://pcmap.place.naver.com/place/${id}/review/ugc`,
      {
        headers: {
          "User-Agent": UA,
          Accept: "text/html,application/json",
          Referer: "https://map.naver.com/",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      }
    );
    if (res.ok) {
      const text = await res.text();
      if (text.trim().startsWith("{")) {
        return extractBlogReviewsFromUnknown(JSON.parse(text), limit);
      }
      const apollo = text.match(
        /window\.__APOLLO_STATE__\s*=\s*(\{[\s\S]*?\});/
      );
      if (apollo?.[1]) {
        return extractBlogReviewsFromUnknown(JSON.parse(apollo[1]), limit);
      }
    }
  } catch {
    // ignore — 리뷰 없이도 등록 가능
  }

  return [];
}

export async function fetchNaverPlaceDetail(
  placeId: string,
  fallback?: Partial<NaverPlaceCandidate>
): Promise<{ detail: NaverPlaceDetail | null; error?: string }> {
  const id = placeId.trim();
  if (!id) return { detail: null, error: "placeId가 필요합니다." };

  const urls = [
    `https://pcmap.place.naver.com/place/${id}/home`,
    `https://m.place.naver.com/place/${id}`,
    `https://map.naver.com/v5/api/sites/summary/${id}?lang=ko`,
    `https://map.naver.com/v5/api/sites/summary/${id}`,
  ];

  let name = fallback?.name ?? "";
  let address = fallback?.address ?? "";
  let phone = fallback?.phone ?? null;
  let description: string | null = null;
  let imageUrls: string[] = [];
  let rating = fallback?.rating ?? null;
  let reviewCount = fallback?.reviewCount ?? null;
  if (fallback?.thumb && isLikelyPlacePhoto(fallback.thumb)) {
    imageUrls = [fallback.thumb];
  }

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": UA,
          Accept: "application/json, text/html, */*",
          Referer: "https://map.naver.com/",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(12_000),
      });
      if (!res.ok) continue;
      const contentType = res.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        const root = asRecord(data) ?? {};
        const place =
          asRecord(root.place) ??
          asRecord(root.business) ??
          asRecord(root.site) ??
          root;
        name = pickString(place.name, place.businessName, name);
        address = pickString(
          place.roadAddress,
          place.address,
          place.fullAddress,
          address
        );
        phone =
          pickBestPhone(
            place.virtualTel,
            place.tel,
            place.phone,
            phone
          ) || phone;
        description =
          pickString(place.description, place.microReview) || description;
        const scores = extractRatingFields(place);
        rating = rating ?? scores.rating;
        reviewCount = reviewCount ?? scores.reviewCount;
        imageUrls = [...imageUrls, ...extractImagesFromDetail(data)];
      } else {
        const html = await res.text();
        const titleMatch = html.match(
          /<meta\s+property="og:title"\s+content="([^"]+)"/i
        );
        const descMatch = html.match(
          /<meta\s+property="og:description"\s+content="([^"]+)"/i
        );
        const imageMatch = html.match(
          /<meta\s+property="og:image"\s+content="([^"]+)"/i
        );
        const phoneMatch = html.match(
          /0(?:50\d|1[016789]|2|3[1-3]|4[1-4]|5[1-5]|6[1-4])[-\s]?\d{3,4}[-\s]?\d{4}/g
        );
        if (titleMatch?.[1]) name = name || titleMatch[1].split(":")[0].trim();
        if (descMatch?.[1]) description = description || descMatch[1];
        if (imageMatch?.[1] && isLikelyPlacePhoto(imageMatch[1])) {
          imageUrls.push(imageMatch[1]);
        }
        if (phoneMatch?.length) {
          phone = pickBestPhone(phone, ...phoneMatch) || phone;
        }

        const scoreMatch = html.match(
          /"visitorReviewScore"\s*:\s*"?([\d.]+)"?/i
        );
        const countMatch = html.match(
          /"visitorReviewCount"\s*:\s*"?(\d+)"?/i
        );
        if (scoreMatch?.[1] && rating == null) {
          rating = pickNumber(scoreMatch[1]);
        }
        if (countMatch?.[1] && reviewCount == null) {
          reviewCount = pickNumber(countMatch[1]);
        }

        const apollo = html.match(
          /window\.__APOLLO_STATE__\s*=\s*(\{[\s\S]*?\});/
        );
        if (apollo?.[1]) {
          try {
            const state = JSON.parse(apollo[1]) as Record<string, unknown>;
            for (const value of Object.values(state)) {
              const rec = asRecord(value);
              if (!rec) continue;
              if (pickString(rec.name) && !name) name = pickString(rec.name);
              if (!address) {
                address = pickString(
                  rec.roadAddress,
                  rec.address,
                  rec.fullAddress
                );
              }
              if (!phone) {
                phone =
                  pickBestPhone(rec.virtualTel, rec.phone, rec.tel) || null;
              } else {
                phone =
                  pickBestPhone(
                    phone,
                    rec.virtualTel,
                    rec.phone,
                    rec.tel
                  ) || phone;
              }
              const scores = extractRatingFields(rec);
              rating = rating ?? scores.rating;
              reviewCount = reviewCount ?? scores.reviewCount;
              imageUrls = [...imageUrls, ...extractImagesFromDetail(rec)];
            }
          } catch {
            // ignore
          }
        }
      }
    } catch {
      // try next
    }
  }

  phone = pickBestPhone(phone) || null;

  if (!name) {
    return {
      detail: null,
      error: "플레이스 상세를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }

  const uniqueImages = [
    ...new Set(imageUrls.filter((u) => isLikelyPlacePhoto(u))),
  ].slice(0, 3);

  // 블로그 리뷰는 등록 시 1회만 (상세 페이지 런타임 호출 금지)
  const blogReviews = await fetchNaverBlogReviews(id, 5);

  return {
    detail: {
      placeId: id,
      name,
      address: address || "주소 미확인",
      phone,
      description,
      imageUrls: uniqueImages,
      naverPlaceUrl: placeUrl(id, name),
      rating,
      reviewCount,
      blogReviews,
    },
  };
}

export async function importNaverPlaceAsListing(
  category: ListingCategory,
  input: {
    placeId: string;
    name?: string;
    address?: string;
    phone?: string | null;
    thumb?: string | null;
    rating?: number | null;
    reviewCount?: number | null;
  }
): Promise<BulkListingItemResult> {
  const { detail, error } = await fetchNaverPlaceDetail(input.placeId, {
    placeId: input.placeId,
    name: input.name ?? "",
    address: input.address ?? "",
    phone: input.phone ?? null,
    thumb: input.thumb ?? null,
    category: null,
    naverPlaceUrl: placeUrl(input.placeId, input.name),
    rating: input.rating ?? null,
    reviewCount: input.reviewCount ?? null,
  });

  if (!detail) {
    return {
      ok: false,
      name: input.name ?? "(이름 없음)",
      error: error ?? "네이버 정보를 가져오지 못했습니다.",
    };
  }

  const { region_big, region_small } = parseKoreanAddress(detail.address);
  const config = getListingConfig(category);
  const suffix = config.defaultTitleSuffix;

  return bulkRegisterListing(category, {
    name: detail.name,
    address: detail.address,
    phone: detail.phone,
    description: detail.description,
    title_copy:
      detail.description?.slice(0, 120) || `${detail.name} ${suffix}`,
    service_info: detail.description,
    region_big,
    region_small,
    image_urls: detail.imageUrls,
    naver_place_url: detail.naverPlaceUrl,
    naver_rating: detail.rating,
    naver_review_count: detail.reviewCount,
    naver_blog_reviews: detail.blogReviews.length
      ? detail.blogReviews
      : null,
  });
}

/** @deprecated use importNaverPlaceAsListing("adoption", ...) */
export async function importNaverPlaceAsAdoption(input: {
  placeId: string;
  name?: string;
  address?: string;
  phone?: string | null;
  thumb?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
}): Promise<BulkListingItemResult> {
  return importNaverPlaceAsListing("adoption", input);
}

export async function importNaverPlaceAsAcademy(input: {
  placeId: string;
  name?: string;
  address?: string;
  phone?: string | null;
  thumb?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
}): Promise<BulkRegisterItemResult> {
  const { detail, error } = await fetchNaverPlaceDetail(input.placeId, {
    placeId: input.placeId,
    name: input.name ?? "",
    address: input.address ?? "",
    phone: input.phone ?? null,
    thumb: input.thumb ?? null,
    category: null,
    naverPlaceUrl: placeUrl(input.placeId, input.name),
    rating: input.rating ?? null,
    reviewCount: input.reviewCount ?? null,
  });

  if (!detail) {
    return {
      ok: false,
      name: input.name ?? "(이름 없음)",
      error: error ?? "네이버 정보를 가져오지 못했습니다.",
    };
  }

  const { region_big, region_small } = parseKoreanAddress(detail.address);

  return bulkRegisterAcademy(
    {
      name: detail.name,
      address: detail.address,
      phone: detail.phone,
      description: detail.description,
      title_copy:
        detail.description?.slice(0, 120) || `${detail.name} 애견미용학원`,
      curriculum: detail.description,
      region_big,
      region_small,
      image_urls: detail.imageUrls,
      naver_place_url: detail.naverPlaceUrl,
      naver_rating: detail.rating,
      naver_review_count: detail.reviewCount,
      naver_blog_reviews: detail.blogReviews.length
        ? detail.blogReviews
        : null,
    },
    { refineWithGemini: false }
  );
}
