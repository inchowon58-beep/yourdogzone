export function isAdminConfigured(): boolean {
  return Boolean(process.env.ACADEMY_ADMIN_SECRET?.trim());
}

export function verifyAdminSecret(request: Request): boolean {
  const secret = process.env.ACADEMY_ADMIN_SECRET?.trim();
  if (!secret) return false;

  const headerSecret = request.headers.get("x-admin-secret")?.trim();
  if (headerSecret === secret) return true;

  const auth = request.headers.get("authorization")?.trim();
  if (auth === `Bearer ${secret}`) return true;

  return false;
}
