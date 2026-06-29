import { AwsClient } from "aws4fetch";
import { buildR2Key } from "@/lib/upload/constants";
import { getR2Config } from "@/lib/upload/r2-server";

function buildR2ObjectUrl(endpoint: string, bucket: string, key: string): string {
  const base = endpoint.replace(/\/$/, "");
  const encodedKey = key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${base}/${bucket}/${encodedKey}`;
}

export async function uploadBufferToR2(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<{ publicUrl: string; key: string } | { error: string }> {
  const config = getR2Config();
  if (!config) {
    return { error: "R2 환경 변수가 설정되지 않았습니다." };
  }

  const key = buildR2Key(filename);
  const objectUrl = buildR2ObjectUrl(config.endpoint, config.bucket, key);

  const aws = new AwsClient({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    service: "s3",
    region: "auto",
  });

  try {
    const response = await aws.fetch(objectUrl, {
      method: "PUT",
      body: new Uint8Array(buffer),
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(buffer.length),
      },
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("R2 PUT 실패:", response.status, detail);
      return {
        error: `R2 저장 실패: HTTP ${response.status}${detail ? ` — ${detail.slice(0, 200)}` : ""}`,
      };
    }

    return {
      publicUrl: `${config.publicBase}/${key}`,
      key,
    };
  } catch (error) {
    console.error("R2 업로드 예외:", error);
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    return { error: `R2 저장 실패: ${message}` };
  }
}
