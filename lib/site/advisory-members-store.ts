import "server-only";

import { readFile, writeFile } from "fs/promises";
import path from "path";
import { createPresignedPutObject } from "@/lib/upload/presign";
import { getPublicBaseUrl } from "@/lib/upload/r2-server";
import { completeR2Uploads } from "@/lib/upload/r2-mirror";
import { absoluteUrl } from "@/lib/site/config";
import type {
  AdvisoryMember,
  AdvisoryMemberInsert,
} from "@/lib/types/advisory-member";

const INDEX_KEY = "advisory-members/index.json";
const LOCAL_FILE = path.join(process.cwd(), "data", "advisory-members.json");

type IndexPayload = {
  updatedAt: string;
  members: AdvisoryMember[];
};

function indexPublicUrl(): string {
  return `${getPublicBaseUrl()}/${INDEX_KEY}`;
}

function sortMembers(members: AdvisoryMember[]): AdvisoryMember[] {
  return [...members].sort((a, b) => a.sortOrder - b.sortOrder);
}

async function readLocalSeed(): Promise<AdvisoryMember[]> {
  try {
    const raw = await readFile(LOCAL_FILE, "utf8");
    const data = JSON.parse(raw) as IndexPayload;
    return Array.isArray(data.members) ? sortMembers(data.members) : [];
  } catch {
    return [];
  }
}

async function writeLocalSeed(members: AdvisoryMember[]): Promise<void> {
  const payload: IndexPayload = {
    updatedAt: new Date().toISOString(),
    members: sortMembers(members),
  };
  await writeFile(LOCAL_FILE, JSON.stringify(payload, null, 2), "utf8");
}

export async function fetchAdvisoryMembersFromR2(options?: {
  noCache?: boolean;
}): Promise<AdvisoryMember[]> {
  try {
    const res = await fetch(indexPublicUrl(), {
      ...(options?.noCache
        ? { cache: "no-store" as const }
        : { next: { revalidate: 60 } }),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as IndexPayload;
    return Array.isArray(data.members) ? sortMembers(data.members) : [];
  } catch {
    return [];
  }
}

export async function getAllAdvisoryMembers(options?: {
  includeUnpublished?: boolean;
  noCache?: boolean;
}): Promise<AdvisoryMember[]> {
  const [fromR2, localSeed] = await Promise.all([
    fetchAdvisoryMembersFromR2({ noCache: options?.noCache }),
    readLocalSeed(),
  ]);

  const localById = new Map(localSeed.map((m) => [m.id, m]));

  const members =
    fromR2.length > 0
      ? fromR2.map((member) => {
          const seed = localById.get(member.id);
          if (!member.profilePhotoUrl?.trim() && seed?.profilePhotoUrl?.trim()) {
            return { ...member, profilePhotoUrl: seed.profilePhotoUrl };
          }
          return member;
        })
      : localSeed;

  if (options?.includeUnpublished) return members;
  return members.filter((m) => m.isPublished);
}

export function resolveAdvisoryPhotoUrl(url?: string): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (trimmed.startsWith("/")) {
    return absoluteUrl(trimmed);
  }
  return trimmed;
}

export async function saveAdvisoryMembers(
  members: AdvisoryMember[]
): Promise<{ ok: true } | { error: string }> {
  const payload: IndexPayload = {
    updatedAt: new Date().toISOString(),
    members: sortMembers(members),
  };
  const body = JSON.stringify(payload, null, 2);

  try {
    await writeLocalSeed(members);
  } catch {
    // Vercel 등 읽기 전용 환경
  }

  const presign = await createPresignedPutObject(INDEX_KEY, "application/json");
  if ("error" in presign) {
    if (process.env.VERCEL) {
      return { error: presign.error };
    }
    return { ok: true };
  }

  try {
    await completeR2Uploads([
      {
        uploadUrl: presign.uploadUrl,
        contentType: presign.contentType,
        body,
      },
    ]);
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "R2 저장 실패";
    return { error: msg };
  }
}

export async function upsertAdvisoryMember(
  input: AdvisoryMemberInsert
): Promise<{ member: AdvisoryMember } | { error: string }> {
  const now = new Date().toISOString();
  const all = await getAllAdvisoryMembers({ includeUnpublished: true, noCache: true });
  const id = input.id?.trim() || `advisory-${Date.now()}`;
  const idx = all.findIndex((m) => m.id === id);

  const member: AdvisoryMember = {
    id,
    sortOrder: input.sortOrder ?? (idx >= 0 ? all[idx].sortOrder : all.length),
    isPublished: input.isPublished ?? true,
    name: input.name?.trim() ?? "",
    category: input.category?.trim() ?? "",
    title: input.title?.trim() ?? "",
    description: input.description?.trim() || undefined,
    profilePhotoUrl: input.profilePhotoUrl?.trim() || undefined,
    kakaoUrl: input.kakaoUrl?.trim() || undefined,
    createdAt: idx >= 0 ? all[idx].createdAt : input.createdAt ?? now,
    updatedAt: now,
  };

  if (!member.title) {
    return { error: "직함을 입력하세요." };
  }

  const next = [...all];
  if (idx >= 0) next[idx] = member;
  else next.push(member);

  const saved = await saveAdvisoryMembers(next);
  if ("error" in saved) return saved;
  return { member };
}

export async function deleteAdvisoryMember(
  id: string
): Promise<{ ok: true } | { error: string }> {
  const all = await getAllAdvisoryMembers({ includeUnpublished: true, noCache: true });
  const next = all.filter((m) => m.id !== id);
  if (next.length === all.length) {
    return { error: "위원을 찾을 수 없습니다." };
  }
  return saveAdvisoryMembers(
    next.map((m, i) => ({ ...m, sortOrder: i }))
  );
}

export async function reorderAdvisoryMembers(
  orderedIds: string[]
): Promise<{ ok: true } | { error: string }> {
  const all = await getAllAdvisoryMembers({ includeUnpublished: true, noCache: true });
  const byId = new Map(all.map((m) => [m.id, m]));

  if (orderedIds.length !== all.length) {
    return { error: "순서 목록이 올바르지 않습니다." };
  }

  const next: AdvisoryMember[] = [];
  for (let i = 0; i < orderedIds.length; i++) {
    const member = byId.get(orderedIds[i]);
    if (!member) return { error: "위원을 찾을 수 없습니다." };
    next.push({ ...member, sortOrder: i, updatedAt: new Date().toISOString() });
  }

  return saveAdvisoryMembers(next);
}
