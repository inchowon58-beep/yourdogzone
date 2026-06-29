/**
 * Cloudflare Worker — Vercel에서 R2 S3 API SSL 오류 시 사용
 *
 * 배포 방법:
 * 1. npm i -g wrangler
 * 2. workers/r2-upload 폴더에서 wrangler login
 * 3. wrangler.toml 의 bucket_name 확인
 * 4. wrangler secret put UPLOAD_SECRET  (임의의 긴 비밀 문자열)
 * 5. wrangler deploy
 * 6. Vercel 환경 변수 추가:
 *    R2_UPLOAD_WORKER_URL=https://r2-upload.yourdogzone.co.kr  (Worker URL)
 *    R2_UPLOAD_WORKER_SECRET=위에서 설정한 비밀값
 */

interface Env {
  BUCKET: R2Bucket;
  UPLOAD_SECRET: string;
  PUBLIC_BASE: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== "POST") {
      return Response.json({ error: "POST only" }, { status: 405 });
    }

    const auth = request.headers.get("Authorization");
    if (auth !== `Bearer ${env.UPLOAD_SECRET}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const formData = await request.formData();
      const file = formData.get("file");
      const key = formData.get("key");

      if (!(file instanceof File) || typeof key !== "string" || !key.trim()) {
        return Response.json({ error: "file과 key가 필요합니다." }, { status: 400 });
      }

      await env.BUCKET.put(key, await file.arrayBuffer(), {
        httpMetadata: { contentType: file.type || "application/octet-stream" },
      });

      const publicBase = env.PUBLIC_BASE.replace(/\/$/, "");
      return Response.json({ publicUrl: `${publicBase}/${key}`, key });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      return Response.json({ error: message }, { status: 500 });
    }
  },
};
