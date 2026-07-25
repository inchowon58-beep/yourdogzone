import { absoluteUrl, getSiteUrl } from "@/lib/site/config";

type IndexNowPayload = {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
};

const INDEXNOW_ENDPOINTS = [
  "https://api.indexnow.org/indexnow",
  "https://www.bing.com/indexnow",
  "https://searchadvisor.naver.com/indexnow",
] as const;

export function indexNowKeyFilePath(): string | null {
  const key = process.env.INDEXNOW_KEY?.trim();
  return key ? `/${key}.txt` : null;
}

export function indexNowKeyLocation(): string | null {
  const path = indexNowKeyFilePath();
  return path ? absoluteUrl(path) : null;
}

function normalizeIndexNowUrls(urls: string[]): {
  host: string;
  urlList: string[];
} {
  const base = getSiteUrl().replace(/\/$/, "");
  const host = new URL(base).host;

  const urlList = [
    ...new Set(
      urls
        .filter((u) => typeof u === "string" && u.startsWith("http"))
        .map((raw) => {
          const parsed = new URL(raw.trim());
          return `${base}${parsed.pathname}${parsed.search}`;
        })
    ),
  ];

  return { host, urlList };
}

async function postIndexNow(
  endpoint: string,
  payload: IndexNowPayload
): Promise<{ ok: boolean; status: number; message: string; body: string }> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
  });

  const body = await response.text().catch(() => "");
  const ok = response.status === 200 || response.status === 202;
  const message = ok
    ? "IndexNow 전송 완료"
    : body.trim()
      ? `IndexNow 응답: ${response.status} — ${body.trim().slice(0, 200)}`
      : `IndexNow 응답: ${response.status}`;

  return { ok, status: response.status, message, body };
}

export async function submitToIndexNow(urls: string[]): Promise<{
  ok: boolean;
  status: number;
  message: string;
}> {
  const key = process.env.INDEXNOW_KEY?.trim();
  if (!key) {
    return { ok: false, status: 400, message: "INDEXNOW_KEY가 설정되지 않았습니다." };
  }

  const keyLocation = indexNowKeyLocation();
  if (!keyLocation) {
    return { ok: false, status: 400, message: "INDEXNOW_KEY가 설정되지 않았습니다." };
  }

  const { host, urlList } = normalizeIndexNowUrls(urls);
  if (urlList.length === 0) {
    return { ok: false, status: 400, message: "전송할 URL이 없습니다." };
  }

  const payload: IndexNowPayload = {
    host,
    key,
    keyLocation,
    urlList: urlList.slice(0, 10_000),
  };

  let last = { ok: false, status: 0, message: "IndexNow 전송 실패", body: "" };

  for (const endpoint of INDEXNOW_ENDPOINTS) {
    last = await postIndexNow(endpoint, payload);
    if (last.ok) {
      return { ok: true, status: last.status, message: last.message };
    }
  }

  // 배치 422 시 URL별 개별 전송 (소량만 — 대량은 클라이언트에서 청크)
  if (last.status === 422 && urlList.length > 1 && urlList.length <= 20) {
    let okCount = 0;
    let lastSingle = last;
    for (const url of urlList) {
      const singlePayload = { ...payload, urlList: [url] };
      for (const endpoint of INDEXNOW_ENDPOINTS) {
        const result = await postIndexNow(endpoint, singlePayload);
        lastSingle = result;
        if (result.ok) {
          okCount += 1;
          break;
        }
      }
    }
    if (okCount > 0) {
      return {
        ok: true,
        status: 200,
        message: `IndexNow 전송 완료 (${okCount}/${urlList.length}건)`,
      };
    }
    return { ok: false, status: lastSingle.status, message: lastSingle.message };
  }

  if (last.status === 422 && urlList.length > 20) {
    return {
      ok: false,
      status: 422,
      message:
        "IndexNow 배치 거부(422). 클라이언트가 URL을 나눠 재전송하세요.",
    };
  }

  return { ok: last.ok, status: last.status, message: last.message };
}

export function academyPageUrl(slug: string): string {
  return absoluteUrl(`/services/academy/${slug}`);
}
