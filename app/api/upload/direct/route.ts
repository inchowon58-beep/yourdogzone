import { handleUploadGet, handleUploadPost } from "@/lib/upload/handle-upload-request";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  return handleUploadPost(request);
}

export async function GET() {
  return handleUploadGet();
}
