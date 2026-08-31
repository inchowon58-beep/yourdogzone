import "server-only";

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { createPresignedPutObject } from "@/lib/upload/presign";
import { getPublicBaseUrl } from "@/lib/upload/r2-server";
import { completeR2Uploads } from "@/lib/upload/r2-mirror-core";

type StoreConfig<T> = {
  indexKey: string;
  localFile: string;
  arrayKey: keyof T;
};

export function createR2JsonStore<T extends Record<string, unknown>>(
  config: StoreConfig<T>
) {
  function indexPublicUrl(): string {
    return `${getPublicBaseUrl()}/${config.indexKey}`;
  }

  async function readLocal(): Promise<T> {
    try {
      const raw = await readFile(config.localFile, "utf8");
      return JSON.parse(raw) as T;
    } catch {
      const empty = {
        updatedAt: new Date().toISOString(),
      } as unknown as T;
      (empty as Record<string, unknown>)[config.arrayKey as string] = [];
      return empty;
    }
  }

  async function writeLocal(payload: T): Promise<void> {
    await mkdir(path.dirname(config.localFile), { recursive: true });
    await writeFile(config.localFile, JSON.stringify(payload, null, 2), "utf8");
  }

  async function fetchFromR2(noCache = true): Promise<T | null> {
    try {
      const res = await fetch(indexPublicUrl(), {
        ...(noCache
          ? { cache: "no-store" as const }
          : { next: { revalidate: 30 } }),
      });
      if (!res.ok) return null;
      return (await res.json()) as T;
    } catch {
      return null;
    }
  }

  async function load(noCache = true): Promise<T> {
    const [fromR2, fromLocal] = await Promise.all([
      fetchFromR2(noCache),
      readLocal(),
    ]);

    if (!fromR2) return fromLocal;

    const r2Items = (fromR2 as Record<string, unknown>)[
      config.arrayKey as string
    ];
    const localItems = (fromLocal as Record<string, unknown>)[
      config.arrayKey as string
    ];

    if (!Array.isArray(r2Items) || r2Items.length === 0) {
      if (Array.isArray(localItems) && localItems.length > 0) {
        return fromLocal;
      }
      return fromR2;
    }

    if (!Array.isArray(localItems) || localItems.length === 0) {
      return fromR2;
    }

    type Mergeable = { id?: string; updated_at?: string; updatedAt?: string };
    const merged = new Map<string, Mergeable>();
    for (const item of r2Items as Mergeable[]) {
      if (item.id) merged.set(item.id, item);
    }
    for (const item of localItems as Mergeable[]) {
      if (!item.id) continue;
      const prev = merged.get(item.id);
      const prevTs = new Date(
        prev?.updated_at ?? prev?.updatedAt ?? 0
      ).getTime();
      const nextTs = new Date(
        item.updated_at ?? item.updatedAt ?? 0
      ).getTime();
      if (!prev || nextTs >= prevTs) {
        merged.set(item.id, item);
      }
    }

    return {
      ...fromR2,
      [config.arrayKey as string]: [...merged.values()],
    } as T;
  }

  async function save(payload: T): Promise<{ ok: true } | { error: string }> {
    const body = JSON.stringify(
      { ...payload, updatedAt: new Date().toISOString() },
      null,
      2
    );

    try {
      await writeLocal(payload);
    } catch {
      // read-only FS
    }

    const presign = await createPresignedPutObject(
      config.indexKey,
      "application/json"
    );
    if ("error" in presign) {
      if (process.env.VERCEL) return { error: presign.error };
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
      return { error: e instanceof Error ? e.message : "R2 저장 실패" };
    }
  }

  return { load, save, readLocal };
}
