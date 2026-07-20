import "server-only";

import { randomUUID } from "crypto";
import path from "path";
import { createR2JsonStore } from "@/lib/care-matching/r2-json-store";
import { sendPushToPartners } from "@/lib/care-matching/push-subscription-queries";
import { absoluteUrl } from "@/lib/site/config";
import type { CareShelterNotification } from "@/lib/types/care-shelter-partner";

type NotificationIndex = {
  updatedAt: string;
  notifications: CareShelterNotification[];
};

const store = createR2JsonStore<NotificationIndex>({
  indexKey: "care-shelter-notifications/index.json",
  localFile: path.join(process.cwd(), "data", "care-shelter-notifications.json"),
  arrayKey: "notifications",
});

async function loadAll(): Promise<CareShelterNotification[]> {
  const data = await store.load(true);
  return Array.isArray(data.notifications) ? data.notifications : [];
}

export async function listNotificationsForPartner(
  partnerId: string
): Promise<CareShelterNotification[]> {
  const all = await loadAll();
  return all
    .filter((n) => n.partner_id === partnerId)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
}

export async function createNotification(input: {
  partner_id: string;
  type: CareShelterNotification["type"];
  title: string;
  body: string;
  application_id?: string | null;
}): Promise<void> {
  const now = new Date().toISOString();
  const note: CareShelterNotification = {
    id: randomUUID(),
    partner_id: input.partner_id,
    type: input.type,
    title: input.title,
    body: input.body,
    application_id: input.application_id ?? null,
    read_at: null,
    created_at: now,
  };

  const data = await store.load(true);
  const notifications = Array.isArray(data.notifications)
    ? [...data.notifications]
    : [];
  notifications.unshift(note);
  await store.save({ ...data, notifications });
}

export async function notifyAllApprovedPartners(input: {
  type: CareShelterNotification["type"];
  title: string;
  body: string;
  application_id: string;
  partnerIds: string[];
}): Promise<void> {
  for (const partner_id of input.partnerIds) {
    await createNotification({
      partner_id,
      type: input.type,
      title: input.title,
      body: input.body,
      application_id: input.application_id,
    });
  }

  await sendPushToPartners(input.partnerIds, {
    title: input.title,
    body: input.body,
    url: absoluteUrl("/care-matching/list"),
  });
}

export async function markNotificationRead(
  partnerId: string,
  notificationId: string
): Promise<void> {
  const data = await store.load(true);
  const notifications = Array.isArray(data.notifications)
    ? [...data.notifications]
    : [];
  const idx = notifications.findIndex(
    (n) => n.id === notificationId && n.partner_id === partnerId
  );
  if (idx < 0) return;
  notifications[idx] = {
    ...notifications[idx],
    read_at: new Date().toISOString(),
  };
  await store.save({ ...data, notifications });
}
