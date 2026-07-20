import type { CareIntakeApplication } from "@/lib/types/care-intake";

const SELECTION_GRACE_MS = 48 * 60 * 60 * 1000;

export function computeRemainingMs(
  app: CareIntakeApplication,
  now = Date.now()
): number | null {
  if (app.status === "matching" && app.matching_ends_at) {
    return Math.max(0, new Date(app.matching_ends_at).getTime() - now);
  }
  if (app.status === "matching_select" && app.selection_ends_at) {
    return Math.max(0, new Date(app.selection_ends_at).getTime() - now);
  }
  return null;
}

export function formatRemaining(ms: number | null): string {
  if (ms === null) return "—";
  if (ms <= 0) return "마감";
  const totalMin = Math.ceil(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h >= 48) return `${Math.floor(h / 24)}일 ${h % 24}시간`;
  if (h > 0) return `${h}시간 ${m}분`;
  return `${m}분`;
}

export function applyMatchingExpiry(
  app: CareIntakeApplication,
  now = new Date()
): CareIntakeApplication {
  const ts = now.getTime();
  let next = app;

  if (
    next.status === "matching" &&
    next.matching_ends_at &&
    ts > new Date(next.matching_ends_at).getTime()
  ) {
    const closedAt = next.matching_ends_at;
    next = {
      ...next,
      status: "matching_select",
      bidding_closed_at: next.bidding_closed_at ?? closedAt,
      selection_ends_at:
        next.selection_ends_at ??
        new Date(
          new Date(closedAt).getTime() + SELECTION_GRACE_MS
        ).toISOString(),
      updated_at: now.toISOString(),
    };
  }

  if (
    next.status === "matching_select" &&
    next.selection_ends_at &&
    ts > new Date(next.selection_ends_at).getTime()
  ) {
    next = {
      ...next,
      status: "expired",
      updated_at: now.toISOString(),
    };
  }

  return next;
}

export function selectionEndsAtFrom(now: Date): string {
  return new Date(now.getTime() + SELECTION_GRACE_MS).toISOString();
}

export function matchingEndsAtFrom(
  hours: number,
  from = new Date()
): string {
  return new Date(from.getTime() + hours * 60 * 60 * 1000).toISOString();
}

export function isOpenForPublicList(app: CareIntakeApplication): boolean {
  return (
    app.status === "deposit_confirmed" ||
    app.status === "pending_review" ||
    app.status === "matching" ||
    app.status === "matching_select"
  );
}
