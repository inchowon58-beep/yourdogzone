import "server-only";

import { randomUUID } from "crypto";
import path from "path";
import { createR2JsonStore } from "@/lib/care-matching/r2-json-store";
import {
  isWebPushConfigured,
  sendWebPush,
  type WebPushPayload,
} from "@/lib/care-matching/web-push-server";

export type CarePushSubscription = {
  id: string;
  partner_id: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  created_at: string;
  updated_at: string;
};

type PushIndex = {
  updatedAt: string;
  subscriptions: CarePushSubscription[];
};

const store = createR2JsonStore<PushIndex>({
  indexKey: "care-shelter-push-subscriptions/index.json",
  localFile: path.join(
    process.cwd(),
    "data",
    "care-shelter-push-subscriptions.json"
  ),
  arrayKey: "subscriptions",
});

async function loadAll(): Promise<CarePushSubscription[]> {
  const data = await store.load(true);
  return Array.isArray(data.subscriptions) ? data.subscriptions : [];
}

async function saveAll(
  subscriptions: CarePushSubscription[]
): Promise<{ ok: true } | { error: string }> {
  const data = await store.load(true);
  return store.save({ ...data, subscriptions });
}

export async function upsertPushSubscription(input: {
  partner_id: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
}): Promise<{ ok: true } | { error: string }> {
  const now = new Date().toISOString();
  const all = await loadAll();
  const idx = all.findIndex(
    (s) =>
      s.partner_id === input.partner_id && s.endpoint === input.endpoint
  );

  if (idx >= 0) {
    all[idx] = {
      ...all[idx],
      keys: input.keys,
      updated_at: now,
    };
  } else {
    all.unshift({
      id: randomUUID(),
      partner_id: input.partner_id,
      endpoint: input.endpoint,
      keys: input.keys,
      created_at: now,
      updated_at: now,
    });
  }

  const saved = await saveAll(all);
  if ("error" in saved) return saved;
  return { ok: true };
}

export async function removePushSubscription(input: {
  partner_id: string;
  endpoint: string;
}): Promise<void> {
  const all = await loadAll();
  const next = all.filter(
    (s) =>
      !(s.partner_id === input.partner_id && s.endpoint === input.endpoint)
  );
  if (next.length !== all.length) {
    await saveAll(next);
  }
}

export async function removePushSubscriptionByEndpoint(
  endpoint: string
): Promise<void> {
  const all = await loadAll();
  const next = all.filter((s) => s.endpoint !== endpoint);
  if (next.length !== all.length) {
    await saveAll(next);
  }
}

export async function sendPushToPartner(
  partnerId: string,
  payload: WebPushPayload
): Promise<void> {
  if (!isWebPushConfigured()) return;

  const all = await loadAll();
  const mine = all.filter((s) => s.partner_id === partnerId);
  for (const sub of mine) {
    const result = await sendWebPush(
      {
        endpoint: sub.endpoint,
        keys: sub.keys,
      },
      payload
    );
    if ("expired" in result && result.expired) {
      await removePushSubscriptionByEndpoint(sub.endpoint);
    }
  }
}

export async function sendPushToPartners(
  partnerIds: string[],
  payload: WebPushPayload
): Promise<void> {
  if (!isWebPushConfigured()) return;
  await Promise.all(
    partnerIds.map((partnerId) => sendPushToPartner(partnerId, payload))
  );
}
