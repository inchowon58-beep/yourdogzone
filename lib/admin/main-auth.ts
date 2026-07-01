export {
  createMainAdminSessionToken,
  getMainAdminCredentials,
  MAIN_ADMIN_COOKIE,
  verifyMainAdminLogin,
  verifyMainAdminSessionToken,
} from "@/lib/admin/main-auth-core";

import { cookies } from "next/headers";
import { MAIN_ADMIN_COOKIE, verifyMainAdminSessionToken } from "@/lib/admin/main-auth-core";

export async function isMainAdminAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  return verifyMainAdminSessionToken(jar.get(MAIN_ADMIN_COOKIE)?.value);
}
