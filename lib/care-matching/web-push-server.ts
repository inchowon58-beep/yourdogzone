import "server-only";

import webpush from "web-push";
import { getSiteUrl } from "@/lib/site/config";

export function getVapidPublicKey(): string | null {
  return process.env.WEB_PUSH_VAPID_PUBLIC_KEY?.trim() || null;
}

function getVapidPrivateKey(): string | null {
  return process.env.WEB_PUSH_VAPID_PRIVATE_KEY?.trim() || null;
}

function getVapidSubject(): string {
  const fromEnv = process.env.WEB_PUSH_VAPID_SUBJECT?.trim();
  if (fromEnv) return fromEnv;
  return `mailto:admin@${new URL(getSiteUrl()).hostname}`;
}

export function isWebPushConfigured(): boolean {
  return Boolean(getVapidPublicKey() && getVapidPrivateKey());
}

function ensureWebPushConfigured(): void {
  const publicKey = getVapidPublicKey();
  const privateKey = getVapidPrivateKey();
  if (!publicKey || !privateKey) {
    throw new Error("WEB_PUSH_VAPID_PUBLIC_KEY / WEB_PUSH_VAPID_PRIVATE_KEY가 설정되지 않았습니다.");
  }
  webpush.setVapidDetails(getVapidSubject(), publicKey, privateKey);
}

export type WebPushPayload = {
  title: string;
  body: string;
  url?: string;
};

export async function sendWebPush(
  subscription: webpush.PushSubscription,
  payload: WebPushPayload
): Promise<{ ok: true } | { expired: true } | { error: string }> {
  if (!isWebPushConfigured()) {
    return { error: "Web Push 미설정" };
  }

  ensureWebPushConfigured();

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload),
      { TTL: 60 * 60 * 24 }
    );
    return { ok: true };
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) {
      return { expired: true };
    }
    const msg = e instanceof Error ? e.message : "푸시 발송 실패";
    return { error: msg };
  }
}
