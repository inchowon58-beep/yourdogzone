/**
 * 지역 SEO 페이지 단건 JSON + summary 백필
 * 사용: node --env-file=.env.local scripts/backfill-regional-page-files.mjs
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!m) continue;
      if (!process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
    }
  } catch {
    // ignore
  }
}

loadEnvLocal();

const endpoint = process.env.R2_ENDPOINT;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET_NAME;
const publicBase = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "").replace(
  /\/$/,
  ""
);

if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
  console.error("R2 env missing");
  process.exit(1);
}

const client = new S3Client({
  region: "auto",
  endpoint,
  credentials: { accessKeyId, secretAccessKey },
  forcePathStyle: true,
});

const INDEX_KEY = "regional-landings/index.json";
const SUMMARY_KEY = "regional-landings/summary.json";

function resolveCategory(page) {
  return page.category || "academy";
}

function toSummary(page) {
  return {
    slug: page.slug,
    category: resolveCategory(page),
    label: page.label,
    keyword: page.keyword,
    isPublished: page.isPublished,
    createdAt: page.createdAt,
    updatedAt: page.updatedAt,
    metaDescription: page.metaDescription,
    regionInfo: page.regionInfo,
    imageUrl: page.imageUrl,
  };
}

async function getText(key) {
  const res = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key })
  );
  return res.Body.transformToString();
}

async function putJson(key, obj) {
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: JSON.stringify(obj),
      ContentType: "application/json",
    })
  );
}

async function main() {
  console.log("Downloading index…");
  let pages;
  try {
    const raw = await getText(INDEX_KEY);
    const data = JSON.parse(raw);
    pages = data.pages || [];
  } catch (e) {
    console.log("R2 get failed, try CDN…", e.message || e);
    const res = await fetch(`${publicBase}/${INDEX_KEY}`);
    const data = await res.json();
    pages = data.pages || [];
  }
  console.log("pages:", pages.length);

  const summary = {
    updatedAt: new Date().toISOString(),
    items: pages.map(toSummary),
  };
  console.log("Uploading summary…");
  await putJson(SUMMARY_KEY, summary);
  console.log("summary ok, bytes~", JSON.stringify(summary).length);

  const concurrency = 20;
  let done = 0;
  let failed = 0;
  for (let i = 0; i < pages.length; i += concurrency) {
    const chunk = pages.slice(i, i + concurrency);
    await Promise.all(
      chunk.map(async (page) => {
        const cat = resolveCategory(page);
        const key = `regional-landings/data/${cat}/${page.slug}.json`;
        try {
          await putJson(key, { ...page, category: cat });
          done += 1;
        } catch (e) {
          failed += 1;
          console.error("fail", key, e.message || e);
        }
      })
    );
    if ((i / concurrency) % 10 === 0) {
      console.log(`progress ${done}/${pages.length} fail=${failed}`);
    }
  }
  console.log("done", { done, failed, total: pages.length });
  console.log(
    "sample",
    `${publicBase}/regional-landings/data/shelter/siheung-dog-shelter-3.json`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
