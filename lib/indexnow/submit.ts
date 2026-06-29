import { absoluteUrl, getSiteUrl } from "@/lib/site/config";

type IndexNowPayload = {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
};

export async function submitToIndexNow(urls: string[]): Promise<{
  ok: boolean;
  status: number;
  message: string;
}> {
  const key = process.env.INDEXNOW_KEY;
  if (!key) {
    return { ok: false, status: 400, message: "INDEXNOW_KEY가 설정되지 않았습니다." };
  }

  if (urls.length === 0) {
    return { ok: false, status: 400, message: "전송할 URL이 없습니다." };
  }

  const siteUrl = getSiteUrl();
  const host = new URL(siteUrl).host;

  const payload: IndexNowPayload = {
    host,
    key,
    keyLocation: absoluteUrl("/api/indexnow/key-file"),
    urlList: urls.slice(0, 10000),
  };

  const response = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
  });

  const message =
    response.status === 200 || response.status === 202
      ? "IndexNow 전송 완료"
      : `IndexNow 응답: ${response.status}`;

  return { ok: response.ok || response.status === 202, status: response.status, message };
}

export function academyPageUrl(slug: string): string {
  return absoluteUrl(`/services/academy/${slug}`);
}
