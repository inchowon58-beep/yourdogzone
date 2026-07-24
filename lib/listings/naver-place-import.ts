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

/**
 * 업체사진(ldb-phinf)만 허용.
 * og:image·예약 배너("놓치면 아까운 혜택" 등)는 URL에 booking/혜택이 없어도
 * 별도 CDN/경로로 오므로 og 메타는 사용하지 않음.
 */
export function isLikelyPlacePhoto(url: string): boolean {
  const raw = url.trim();
  if (!raw.startsWith("http://") && !raw.startsWith("https://")) return false;
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    // keep raw
  }
  const lower = `${raw} ${decoded}`.toLowerCase();

  if (
    /booking|reservation|예약|혜택|promo|banner|og_default|placeholder|captcha|map\.naver\.com\/assets|\/static\/map|\/static\/img|smartplace|naver\.me\/static/i.test(
      lower
    )
  ) {
    return false;
  }
  if (/ssl\.pstatic\.net\/static/i.test(lower)) return false;
  // 네이버 예약/지도 기본 배너
  if (/nid\.naver\.com|ssl\.pstatic\.net\/melon|storep-phinf/i.test(lower)) {
    return false;
  }

  // 업체 업로드 원본 CDN만 우선
  if (/ldb-phinf\.pstatic\.net/i.test(lower)) return true;

  // search.pstatic 프록시인데 원본이 ldb-phinf 인 경우만
  if (/search\.pstatic\.net/i.test(lower) && /ldb-phinf\.pstatic\.net/i.test(lower)) {
    return true;
  }

  return false;
}

/** search.pstatic 프록시 → ldb-phinf 원본 URL */
export function unwrapPlacePhotoUrl(url: string): string {
  const raw = url.trim();
  try {
    const u = new URL(raw);
    if (/search\.pstatic\.net/i.test(u.hostname)) {
      const src = u.searchParams.get("src");
      if (src?.startsWith("http")) return decodeURIComponent(src);
    }
  } catch {
    // keep
  }
  const m = raw.match(/[?&]src=(https?[^&]+)/i);
  if (m?.[1]) {
    try {
      return decodeURIComponent(m[1]);
    } catch {
      return m[1];
    }
  }
  return raw;
}

function pushBusinessPhoto(urls: string[], raw: unknown) {
  if (typeof raw !== "string" || !raw.startsWith("http")) return;
  const unwrapped = unwrapPlacePhotoUrl(raw);
  if (!isLikelyPlacePhoto(unwrapped)) return;
  if (!urls.includes(unwrapped)) urls.push(unwrapped);
}

function extractImagesFromDetail(data: unknown): string[] {
  const root = asRecord(data);
  if (!root) return [];
  const urls: string[] = [];

  const walk = (value: unknown, depth = 0) => {
    if (depth > 5 || urls.length >= 8) return;
    if (typeof value === "string") {
      pushBusinessPhoto(urls, value);
      return;
    }
    if (Array.isArray(value)) {
      for (const item of value) walk(item, depth + 1);
      return;
    }
    const rec = asRecord(value);
    if (!rec) return;
    // 업체사진(ibu) 우선
    const type = pickString(rec.photoType, rec.type, rec.category, rec.viewType);
    const isBiz =
      !type ||
      /ibu|business|업체|owner|official/i.test(type) ||
      rec.isOfficial === true;
    if (isBiz) {
      pushBusinessPhoto(
        urls,
        rec.url ?? rec.originUrl ?? rec.originalUrl ?? rec.imageUrl ?? rec.thumbnail
      );
    }
    for (const [k, v] of Object.entries(rec)) {
      if (/photo|image|url|thum/i.test(k)) walk(v, depth + 1);
    }
  };

  walk(root.images ?? root.photos ?? root.photoList ?? root);
  const detail = asRecord(root.place) ?? asRecord(root.business) ?? root;
  pushBusinessPhoto(urls, detail?.thumUrl);
  pushBusinessPhoto(urls, detail?.imageUrl);
  if (Array.isArray(detail?.imageUrls)) {
    for (const u of detail.imageUrls) pushBusinessPhoto(urls, u);
  }

  return urls.slice(0, 6);
}

/** HTML에서 ldb-phinf 업체사진 URL만 추출 */
function extractLdbPhotosFromHtml(html: string, limit = 6): string[] {
  const urls: string[] = [];
  const re =
    /https?:\/\/ldb-phinf\.pstatic\.net\/[^\s"'\\<>]+/gi;
  for (const match of html.matchAll(re)) {
    let u = match[0].replace(/\\u002F/g, "/").replace(/\\/g, "");
    u = u.replace(/[),;]+$/, "");
    pushBusinessPhoto(urls, u);
    if (urls.length >= limit) break;
  }
  // search.pstatic 프록시(원본 ldb)도
  const proxyRe =
    /https?:\/\/search\.pstatic\.net\/common\/\?[^"'\\\s]*ldb-phinf[^"'\\\s]*/gi;
  for (const match of html.matchAll(proxyRe)) {
    pushBusinessPhoto(urls, match[0].replace(/\\u002F/g, "/").replace(/\\/g, ""));
    if (urls.length >= limit) break;
  }
  return urls.slice(0, limit);
}

function extractRatingsFromText(text: string): {
  rating: number | null;
  reviewCount: number | null;
} {
  const scoreMatch =
    text.match(/"visitorReviewScore"\s*:\s*"?([\d.]+)"?/i) ||
    text.match(/visitorReviewScore["\s:=]+([\d.]+)/i) ||
    text.match(/"averageScore"\s*:\s*"?([\d.]+)"?/i) ||
    text.match(/"avgRating"\s*:\s*"?([\d.]+)"?/i);
  const countMatch =
    text.match(/"visitorReviewCount"\s*:\s*"?(\d+)"?/i) ||
    text.match(/visitorReviewCount["\s:=]+(\d+)/i) ||
    text.match(/"totalReviewCount"\s*:\s*"?(\d+)"?/i);

  return {
    rating: pickNumber(scoreMatch?.[1]),
    reviewCount: pickNumber(countMatch?.[1]),
  };
}

function extractRatingsFromUnknown(data: unknown): {
  rating: number | null;
  reviewCount: number | null;
} {
  let rating: number | null = null;
  let reviewCount: number | null = null;

  const walk = (value: unknown, depth = 0) => {
    if ((rating != null && reviewCount != null) || depth > 6) return;
    const rec = asRecord(value);
    if (rec) {
      const scores = extractRatingFields(rec);
      rating = rating ?? scores.rating;
      reviewCount = reviewCount ?? scores.reviewCount;
      for (const v of Object.values(rec)) walk(v, depth + 1);
      return;
    }
    if (Array.isArray(value)) {
      for (const item of value) walk(item, depth + 1);
    }
  };

  walk(data);
  return { rating, reviewCount };
}

/** 업체사진 탭에서만 수집 — 홈 og:image(예약 배너) 사용 금지 */
export async function fetchNaverPlacePhotos(
  placeId: string,
  limit = 3
): Promise<string[]> {
  const id = placeId.trim();
  if (!id) return [];

  const urls: string[] = [];

  const photoPages = [
    `https://m.place.naver.com/place/${id}/photo`,
    `https://pcmap.place.naver.com/place/${id}/photo`,
    `https://m.place.naver.com/place/${id}/photo?filter=ibu`,
  ];

  for (const url of photoPages) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": UA,
          Accept: "text/html,application/json,*/*",
          Referer: `https://m.place.naver.com/place/${id}`,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(12_000),
      });
      if (!res.ok) continue;
      const text = await res.text();
      for (const u of extractLdbPhotosFromHtml(text, limit)) {
        pushBusinessPhoto(urls, u);
      }
      const apollo = text.match(
        /window\.__APOLLO_STATE__\s*=\s*(\{[\s\S]*?\});/
      );
      if (apollo?.[1]) {
        try {
          for (const u of extractImagesFromDetail(JSON.parse(apollo[1]))) {
            pushBusinessPhoto(urls, u);
          }
        } catch {
          // ignore
        }
      }
      if (text.trim().startsWith("{")) {
        try {
          for (const u of extractImagesFromDetail(JSON.parse(text))) {
            pushBusinessPhoto(urls, u);
          }
        } catch {
          // ignore
        }
      }
      if (urls.length >= limit) break;
    } catch {
      // try next
    }
  }

  // GraphQL 업체사진(ibu) 시도
  if (urls.length < limit) {
    const gqlBodies = [
      {
        operationName: "getPhotoViewerItems",
        query: `query getPhotoViewerItems($input: PhotoViewerInput) {
          photoViewer(input: $input) {
            photos { url originalUrl imageUrl photoType }
          }
        }`,
        variables: {
          input: {
            businessId: id,
            businessType: "place",
            category: "업체",
            page: 1,
            size: limit,
          },
        },
      },
      {
        operationName: "photoList",
        query: `query photoList($input: PhotoListInput) {
          photoList(input: $input) {
            photos { url originalUrl imageUrl type photoType }
          }
        }`,
        variables: {
          input: {
            businessId: id,
            businessType: "place",
            page: 1,
            display: limit,
            photoType: "ibu",
          },
        },
      },
    ];
    for (const endpoint of [
      "https://pcmap-api.place.naver.com/graphql",
      "https://pcmap-api.place.naver.com/place/graphql",
    ]) {
      for (const body of gqlBodies) {
        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: {
              "User-Agent": UA,
              Accept: "application/json",
              "Content-Type": "application/json",
              Referer: `https://m.place.naver.com/place/${id}/photo`,
            },
            body: JSON.stringify(body),
            cache: "no-store",
            signal: AbortSignal.timeout(10_000),
          });
          if (!res.ok) continue;
          const data = await res.json();
          for (const u of extractImagesFromDetail(data)) {
            pushBusinessPhoto(urls, u);
          }
          if (urls.length >= limit) break;
        } catch {
          // try next
        }
      }
      if (urls.length >= limit) break;
    }
  }

  return [...new Set(urls)].slice(0, limit);
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
    if (out.length >= limit || depth > 7) return;
    if (Array.isArray(value)) {
      for (const item of value) {
        const rec = asRecord(item);
        if (
          rec &&
          (rec.title ||
            rec.blogTitle ||
            rec.contents ||
            rec.body ||
            rec.landingUrl ||
            rec.blogUrl)
        ) {
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
      if (/blog|review|ugc|article|item/i.test(k)) {
        walk(v, depth + 1);
      }
    }
  };

  walk(data);
  return out.slice(0, limit);
}

function extractBlogReviewsFromHtml(html: string, limit = 5): NaverBlogReview[] {
  const out: NaverBlogReview[] = [];
  const seen = new Set<string>();

  // blog.naver.com 링크 + 근처 제목
  const linkRe =
    /https?:\/\/blog\.naver\.com\/[^\s"'\\<>]+/gi;
  const titles: string[] = [];
  for (const m of html.matchAll(
    /"(?:title|blogTitle|name)"\s*:\s*"([^"]{4,120})"/g
  )) {
    titles.push(m[1]);
  }
  const bodies: string[] = [];
  for (const m of html.matchAll(
    /"(?:contents|body|description|summary)"\s*:\s*"([^"]{8,200})"/g
  )) {
    bodies.push(m[1]);
  }

  let i = 0;
  for (const match of html.matchAll(linkRe)) {
    const url = match[0].replace(/\\u002F/g, "/").replace(/\\/g, "");
    if (seen.has(url)) continue;
    seen.add(url);
    const title = stripHtml(titles[i] || `네이버 블로그 리뷰 ${i + 1}`);
    const body = stripHtml(bodies[i] || "").slice(0, 160);
    out.push({ title, body: body || title, url });
    i += 1;
    if (out.length >= limit) break;
  }

  if (out.length === 0 && titles.length > 0) {
    for (let j = 0; j < Math.min(limit, titles.length); j++) {
      out.push({
        title: stripHtml(titles[j]),
        body: stripHtml(bodies[j] || titles[j]).slice(0, 160),
        url: null,
      });
    }
  }

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
    "https://pcmap-api.place.naver.com/place/graphql",
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
            Referer: `https://m.place.naver.com/place/${id}/review/ugc`,
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

  // article list API
  try {
    const articleUrl =
      `https://pcmap.place.naver.com/article/list?businessId=${id}&page=1&displayCount=${limit}`;
    const res = await fetch(articleUrl, {
      headers: {
        "User-Agent": UA,
        Accept: "application/json,text/html,*/*",
        Referer: `https://m.place.naver.com/place/${id}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) {
      const text = await res.text();
      if (text.trim().startsWith("{") || text.trim().startsWith("[")) {
        const reviews = extractBlogReviewsFromUnknown(JSON.parse(text), limit);
        if (reviews.length > 0) return reviews;
      }
      const fromHtml = extractBlogReviewsFromHtml(text, limit);
      if (fromHtml.length > 0) return fromHtml;
    }
  } catch {
    // ignore
  }

  for (const path of [
    `https://m.place.naver.com/place/${id}/review/ugc`,
    `https://pcmap.place.naver.com/place/${id}/review/ugc`,
  ]) {
    try {
      const res = await fetch(path, {
        headers: {
          "User-Agent": UA,
          Accept: "text/html,application/json",
          Referer: "https://map.naver.com/",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) continue;
      const text = await res.text();
      if (text.trim().startsWith("{")) {
        const reviews = extractBlogReviewsFromUnknown(JSON.parse(text), limit);
        if (reviews.length > 0) return reviews;
      }
      const apollo = text.match(
        /window\.__APOLLO_STATE__\s*=\s*(\{[\s\S]*?\});/
      );
      if (apollo?.[1]) {
        try {
          const reviews = extractBlogReviewsFromUnknown(
            JSON.parse(apollo[1]),
            limit
          );
          if (reviews.length > 0) return reviews;
        } catch {
          // ignore
        }
      }
      const fromHtml = extractBlogReviewsFromHtml(text, limit);
      if (fromHtml.length > 0) return fromHtml;
    } catch {
      // try next
    }
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
    `https://m.place.naver.com/place/${id}/home`,
    `https://map.naver.com/v5/api/sites/summary/${id}?lang=ko`,
    `https://map.naver.com/v5/api/sites/summary/${id}`,
  ];

  let name = fallback?.name ?? "";
  let address = fallback?.address ?? "";
  let phone = fallback?.phone ?? null;
  let description: string | null = null;
  let rating = fallback?.rating ?? null;
  let reviewCount = fallback?.reviewCount ?? null;

  // 사진은 업체사진 탭에서만 (예약 배너 방지)
  let imageUrls = await fetchNaverPlacePhotos(id, 3);

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
        const scores = extractRatingsFromUnknown(data);
        rating = rating ?? scores.rating;
        reviewCount = reviewCount ?? scores.reviewCount;
        if (imageUrls.length < 3) {
          for (const u of extractImagesFromDetail(data)) {
            pushBusinessPhoto(imageUrls, u);
          }
        }
      } else {
        const html = await res.text();
        const titleMatch = html.match(
          /<meta\s+property="og:title"\s+content="([^"]+)"/i
        );
        const descMatch = html.match(
          /<meta\s+property="og:description"\s+content="([^"]+)"/i
        );
        // og:image 는 예약 배너가 많아서 절대 사용하지 않음
        const phoneMatch = html.match(
          /0(?:50\d|1[016789]|2|3[1-3]|4[1-4]|5[1-5]|6[1-4])[-\s]?\d{3,4}[-\s]?\d{4}/g
        );
        if (titleMatch?.[1]) name = name || titleMatch[1].split(":")[0].trim();
        if (descMatch?.[1]) description = description || descMatch[1];
        if (phoneMatch?.length) {
          phone = pickBestPhone(phone, ...phoneMatch) || phone;
        }

        const fromText = extractRatingsFromText(html);
        rating = rating ?? fromText.rating;
        reviewCount = reviewCount ?? fromText.reviewCount;

        if (imageUrls.length < 3) {
          for (const u of extractLdbPhotosFromHtml(html, 3)) {
            pushBusinessPhoto(imageUrls, u);
          }
        }

        const apollo = html.match(
          /window\.__APOLLO_STATE__\s*=\s*(\{[\s\S]*?\});/
        );
        if (apollo?.[1]) {
          try {
            const state = JSON.parse(apollo[1]) as Record<string, unknown>;
            const scores = extractRatingsFromUnknown(state);
            rating = rating ?? scores.rating;
            reviewCount = reviewCount ?? scores.reviewCount;
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
            }
            if (imageUrls.length < 3) {
              for (const u of extractImagesFromDetail(state)) {
                pushBusinessPhoto(imageUrls, u);
              }
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

  // 사진이 여전히 없으면 fallback thumb (업체사진 필터 통과분만)
  if (imageUrls.length === 0 && fallback?.thumb) {
    pushBusinessPhoto(imageUrls, fallback.thumb);
  }

  phone = pickBestPhone(phone) || null;

  if (!name) {
    return {
      detail: null,
      error: "플레이스 상세를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }

  const uniqueImages = [...new Set(imageUrls)].slice(0, 3);

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
