import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import { AwsClient } from "aws4fetch";
import { buildR2Key } from "@/lib/upload/constants";
import { createIpv4Tls12Agent, ipv4Fetch } from "@/lib/upload/r2-http";
import {
  extractR2AccountId,
  getR2Config,
  type R2Config,
} from "@/lib/upload/r2-server";

function encodeObjectKey(key: string): string {
  return key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function buildPathStyleUrl(endpoint: string, bucket: string, key: string): string {
  const base = endpoint.replace(/\/$/, "");
  return `${base}/${bucket}/${encodeObjectKey(key)}`;
}

function buildVirtualHostedUrl(
  accountId: string,
  bucket: string,
  key: string
): string {
  return `https://${bucket}.${accountId}.r2.cloudflarestorage.com/${encodeObjectKey(key)}`;
}

function formatError(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const parts = [error.message];
  if (error.cause instanceof Error) parts.push(error.cause.message);
  return parts.join(" — ");
}

function createS3Client(config: R2Config, forcePathStyle: boolean) {
  return new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle,
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    requestHandler: new NodeHttpHandler({
      httpsAgent: createIpv4Tls12Agent(),
      connectionTimeout: 15_000,
      requestTimeout: 30_000,
    }),
  });
}

async function uploadWithS3Sdk(
  config: R2Config,
  buffer: Buffer,
  key: string,
  contentType: string,
  forcePathStyle: boolean
): Promise<void> {
  const client = createS3Client(config, forcePathStyle);
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );
  } finally {
    client.destroy();
  }
}

async function uploadWithAws4Fetch(
  config: R2Config,
  buffer: Buffer,
  key: string,
  contentType: string,
  objectUrl: string
): Promise<void> {
  const aws = new AwsClient({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    service: "s3",
    region: "auto",
  });

  const request = new Request(objectUrl, {
    method: "PUT",
    body: new Uint8Array(buffer),
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(buffer.length),
    },
  });

  const signed = await aws.sign(request);
  const response = await ipv4Fetch(signed.url, {
    method: signed.method,
    headers: signed.headers,
    body: signed.body,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `HTTP ${response.status}${detail ? `: ${detail.slice(0, 120)}` : ""}`
    );
  }
}

async function uploadViaWorker(
  buffer: Buffer,
  key: string,
  contentType: string,
  filename: string
): Promise<{ publicUrl: string } | null> {
  const workerUrl = process.env.R2_UPLOAD_WORKER_URL?.trim();
  const workerSecret = process.env.R2_UPLOAD_WORKER_SECRET?.trim();
  if (!workerUrl || !workerSecret) return null;

  const formData = new FormData();
  formData.append("key", key);
  formData.append(
    "file",
    new Blob([new Uint8Array(buffer)], { type: contentType }),
    filename
  );

  const response = await fetch(workerUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${workerSecret}` },
    body: formData,
  });

  const data = (await response.json()) as {
    publicUrl?: string;
    error?: string;
  };

  if (!response.ok || !data.publicUrl) {
    throw new Error(data.error ?? `Worker HTTP ${response.status}`);
  }

  return { publicUrl: data.publicUrl };
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
  const accountId = extractR2AccountId(config.endpoint);

  if (process.env.R2_UPLOAD_WORKER_URL) {
    try {
      const workerResult = await uploadViaWorker(
        buffer,
        key,
        contentType,
        filename
      );
      if (workerResult) {
        return { publicUrl: workerResult.publicUrl, key };
      }
    } catch (error) {
      console.error("Worker 업로드 실패:", formatError(error));
    }
  }

  const errors: string[] = [];
  const attempts: Array<{ label: string; run: () => Promise<void> }> = [
    {
      label: "S3 SDK (virtual-hosted, IPv4 TLS1.2)",
      run: () => uploadWithS3Sdk(config, buffer, key, contentType, false),
    },
    {
      label: "S3 SDK (path-style, IPv4 TLS1.2)",
      run: () => uploadWithS3Sdk(config, buffer, key, contentType, true),
    },
  ];

  if (accountId) {
    attempts.push({
      label: "aws4fetch (virtual-hosted, IPv4 TLS1.2)",
      run: () =>
        uploadWithAws4Fetch(
          config,
          buffer,
          key,
          contentType,
          buildVirtualHostedUrl(accountId, config.bucket, key)
        ),
    });
  }

  attempts.push({
    label: "aws4fetch (path-style, IPv4 TLS1.2)",
    run: () =>
      uploadWithAws4Fetch(
        config,
        buffer,
        key,
        contentType,
        buildPathStyleUrl(config.endpoint, config.bucket, key)
      ),
  });

  for (const attempt of attempts) {
    try {
      await attempt.run();
      return { publicUrl: `${config.publicBase}/${key}`, key };
    } catch (error) {
      const msg = formatError(error);
      console.error(`R2 업로드 실패 [${attempt.label}]:`, msg);
      errors.push(`${attempt.label}: ${msg}`);
    }
  }

  return {
    error: `R2 저장 실패: ${errors.join(" | ")}`,
  };
}
