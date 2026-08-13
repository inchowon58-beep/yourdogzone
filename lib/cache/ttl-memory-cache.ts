/**
 * Vercel Data Cache(unstable_cache) 대신 인스턴스 메모리 TTL 캐시.
 * 대용량 JSON(지역 SEO index 등)은 Data Cache 한도(약 2MB)를 넘겨
 * "Failed to set Next.js data cache" 경고와 반복 연산을 유발함.
 */
export type TtlMemoryCache<T> = {
  value: T;
  expiresAt: number;
};

export function readTtlMemoryCache<T>(
  slot: TtlMemoryCache<T> | null | undefined,
  now = Date.now()
): T | null {
  if (!slot) return null;
  if (slot.expiresAt <= now) return null;
  return slot.value;
}

export function writeTtlMemoryCache<T>(
  value: T,
  ttlMs: number,
  now = Date.now()
): TtlMemoryCache<T> {
  return { value, expiresAt: now + ttlMs };
}
