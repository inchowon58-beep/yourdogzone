import { PutObjectCommand } from "@aws-sdk/client-s3";
import { createR2S3Client, getR2Config } from "@/lib/upload/r2-server";
import { buildR2Key, resolveImageContentType } from "@/lib/upload/constants";

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
  const client = createR2S3Client(config);

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );

    return {
      publicUrl: `${config.publicBase}/${key}`,
      key,
    };
  } catch (error) {
    console.error("R2 PutObject 실패:", error);
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    return { error: `R2 저장 실패: ${message}` };
  }
}
