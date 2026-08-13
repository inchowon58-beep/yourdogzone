/**
 * Vercel Image Optimization 우회 — src를 그대로 반환 (R2/CDN 직접 로드).
 * next.config.ts 의 images.loaderFile 에서 사용.
 */
export default function imageLoader({ src }: { src: string }): string {
  return src;
}
