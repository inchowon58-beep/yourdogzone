import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import https from "node:https";
import { getR2Config } from "@/lib/upload/r2-server";

const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 20,
  rejectUnauthorized: true,
  minVersion: "TLSv1.2",
});

function createDataS3Client() {
  const config = getR2Config();
  if (!config) return null;
  return new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: true,
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    requestHandler: new NodeHttpHandler({
      httpsAgent,
      connectionTimeout: 8_000,
      requestTimeout: 45_000,
    }),
  });
}

/** CDN 우회 — R2에서 직접 index/JSON 읽기 (대량 upsert 안정성) */
export async function getR2ObjectText(key: string): Promise<string | null> {
  const config = getR2Config();
  const client = createDataS3Client();
  if (!config || !client) return null;

  try {
    const res = await client.send(
      new GetObjectCommand({
        Bucket: config.bucket,
        Key: key.replace(/^\//, ""),
      })
    );
    const body = res.Body;
    if (!body) return null;
    return await body.transformToString();
  } catch {
    return null;
  }
}
