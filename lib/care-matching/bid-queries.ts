import "server-only";

import { randomUUID } from "crypto";
import path from "path";
import { createR2JsonStore } from "@/lib/care-matching/r2-json-store";
import type { CareShelterBid } from "@/lib/types/care-shelter-partner";

type BidIndex = {
  updatedAt: string;
  bids: CareShelterBid[];
};

const store = createR2JsonStore<BidIndex>({
  indexKey: "care-shelter-bids/index.json",
  localFile: path.join(process.cwd(), "data", "care-shelter-bids.json"),
  arrayKey: "bids",
});

async function loadBids(): Promise<CareShelterBid[]> {
  const data = await store.load(true);
  return Array.isArray(data.bids) ? data.bids : [];
}

export async function listBidsForApplication(
  applicationId: string
): Promise<CareShelterBid[]> {
  const all = await loadBids();
  return all.filter((b) => String(b.application_id) === String(applicationId));
}

export async function countBidsForApplication(
  applicationId: string
): Promise<number> {
  return (await listBidsForApplication(applicationId)).length;
}

export async function getBidByPartnerAndApplication(
  partnerId: string,
  applicationId: string
): Promise<CareShelterBid | null> {
  const all = await loadBids();
  return (
    all.find(
      (b) =>
        b.partner_id === partnerId &&
        String(b.application_id) === String(applicationId)
    ) ?? null
  );
}

export async function insertShelterBid(input: {
  application_id: string;
  partner_id: string;
  amount: number;
}): Promise<{ data: CareShelterBid | null; error: string | null }> {
  const amount = Math.round(input.amount);
  if (!Number.isFinite(amount) || amount < 10000) {
    return { data: null, error: "제안 금액은 1만원 이상이어야 합니다." };
  }

  const existing = await getBidByPartnerAndApplication(
    input.partner_id,
    input.application_id
  );
  if (existing) {
    return { data: null, error: "이미 제안하셨습니다. 금액 변경은 불가합니다." };
  }

  const now = new Date().toISOString();
  const bid: CareShelterBid = {
    id: randomUUID(),
    application_id: String(input.application_id),
    partner_id: input.partner_id,
    amount,
    created_at: now,
  };

  const data = await store.load(true);
  const bids = Array.isArray(data.bids) ? [...data.bids] : [];
  bids.unshift(bid);
  const saved = await store.save({ ...data, bids });
  if ("error" in saved) return { data: null, error: saved.error };
  return { data: bid, error: null };
}

export async function listBidAmountsForApplicant(
  applicationId: string
): Promise<{ id: string; amount: number; partner_id: string }[]> {
  const bids = await listBidsForApplication(applicationId);
  return bids
    .map((b) => ({ id: b.id, amount: b.amount, partner_id: b.partner_id }))
    .sort((a, b) => a.amount - b.amount);
}

export async function getBidById(id: string): Promise<CareShelterBid | null> {
  const all = await loadBids();
  return all.find((b) => b.id === id) ?? null;
}
