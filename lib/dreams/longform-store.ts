import "server-only";

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { generateDreamLongformWithGemini } from "@/lib/ai/dream-gemini";
import {
  animalLabel,
  getDreamBySlug,
  situationLabel,
} from "@/lib/dreams/catalog";
import type { DreamLongform } from "@/lib/dreams/longform-types";
import { createPresignedPutObject } from "@/lib/upload/presign";
import { getPublicBaseUrl } from "@/lib/upload/r2-server";
import { completeR2Uploads } from "@/lib/upload/r2-mirror-core";

const LOCAL_DIR = path.join(process.cwd(), "data", "dreams-longform");

function r2Key(slug: string) {
  return `dreams/longform/${slug}.json`;
}

function localPath(slug: string) {
  return path.join(LOCAL_DIR, `${slug}.json`);
}

async function readLocal(slug: string): Promise<DreamLongform | null> {
  try {
    const raw = await readFile(localPath(slug), "utf8");
    return JSON.parse(raw) as DreamLongform;
  } catch {
    return null;
  }
}

async function writeLocal(slug: string, doc: DreamLongform): Promise<void> {
  await mkdir(LOCAL_DIR, { recursive: true });
  await writeFile(localPath(slug), JSON.stringify(doc, null, 2), "utf8");
}

async function readR2(slug: string): Promise<DreamLongform | null> {
  try {
    const base = getPublicBaseUrl();
    if (!base) return null;
    const url = `${base}/${r2Key(slug)}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return (await res.json()) as DreamLongform;
  } catch {
    return null;
  }
}

async function writeR2(slug: string, doc: DreamLongform): Promise<void> {
  try {
    const body = JSON.stringify(doc);
    const presign = await createPresignedPutObject(r2Key(slug), "application/json");
    if ("error" in presign) return;
    await completeR2Uploads([
      {
        uploadUrl: presign.uploadUrl,
        contentType: presign.contentType,
        body,
      },
    ]);
  } catch (e) {
    console.warn("[dream-longform] R2 저장 실패(로컬만 유지)", e);
  }
}

function fallbackFromCatalog(slug: string): DreamLongform | null {
  const article = getDreamBySlug(slug);
  if (!article) return null;

  const symbolism = [
    article.summary,
    "",
    `${animalLabel(article.animal)} 꿈에서 보이는 ‘${situationLabel(article.situationId)}’ 장면은, 단순한 우연이 아니라 보호자의 일상·애착·돌봄 리듬이 무의식에 투영된 결과인 경우가 많습니다. 전통적으로 ${article.omen}으로 분류되지만, 현대 반려심리에서는 ‘예언’보다 ‘마음 읽기’에 가깝게 해석합니다.`,
    "",
    "꿈의 분위기가 밝았다면 관계의 회복·기대·자유 욕구가, 어두웠다면 건강 염려·분리불안·죄책감이 섞여 있을 수 있습니다. 어느 쪽이든 아이를 아끼는 마음이 꿈의 주인공입니다.",
    "",
    "검색으로 이 페이지를 찾은 분이라면, 같은 꿈을 꾼 보호자들이 흔히 느끼는 질문—‘흉몽일까, 길몽일까, 아니면 그냥 그리운 마음일까’—에 대한 답을 찾고 계실 겁니다. 단정적인 점괘보다, 오늘 아이에게 건넬 수 있는 작은 돌봄으로 이어질 때 해몽은 가장 쓸모가 있습니다.",
  ].join("\n");

  const psychology = [
    article.psychology,
    "",
    "보호자는 종종 꿈을 ‘경고’로만 받아들이며 스스로를 다그치곤 합니다. 그러나 다치거나 죽은 아이가 나오는 꿈조차, 대부분은 돌봄 욕구와 애도의 과정이 안전하게 표현되는 통로입니다. 불안이 크다면 기록을 남기고, 평온했다면 그 감정을 믿어도 됩니다.",
    "",
    "최근 업무·육아·이사 등으로 아이와 보내는 시간이 줄었다면, 꿈은 ‘다시 연결하자’는 부드러운 알람일 수 있습니다. 반대로 지나치게 집착하고 있다면, 아이에게도 숨 쉴 공간이 필요하다는 메시지일 수 있어요.",
  ].join("\n");

  return {
    omen: article.omen,
    headline: article.title.replace(", 무슨 의미일까요?", " — 마음을 읽다"),
    summaryBox: article.summary,
    symbolism,
    details: article.situations.map((s) => ({
      title: s.title,
      body: `${s.body}\n\n같은 장면이라도 꿈속 감정(설렘·두려움·그리움)에 따라 해석의 무게가 달라집니다. 깨어난 직후의 첫 감정을 적어 두면, 다음번에 비슷한 꿈을 꿨을 때 패턴을 발견하기 쉽습니다.`,
    })),
    psychology,
    careTip: `${article.careTip}\n\n가능하면 오늘 안에 ‘짧은 스킨십 + 좋아하는 놀이 5분 + 물·배변 체크’만 실천해 보세요. 꿈 해몽은 점술이 아니라, 반려생활의 리듬을 되돌리는 초대장입니다.`,
    quote: "꿈은 아이를 떠올리게 하는 마음이지, 아이를 단죄하는 판결문이 아닙니다.",
    generatedAt: new Date().toISOString(),
    source: "fallback",
  };
}

export async function loadDreamLongform(
  slug: string
): Promise<DreamLongform | null> {
  const local = await readLocal(slug);
  if (local?.symbolism) return local;
  const remote = await readR2(slug);
  if (remote?.symbolism) {
    await writeLocal(slug, remote).catch(() => undefined);
    return remote;
  }
  return null;
}

export async function getOrGenerateDreamLongform(
  slug: string
): Promise<DreamLongform> {
  const cached = await loadDreamLongform(slug);
  const force = process.env.DREAM_FORCE_REGEN === "1";
  if (cached && cached.source === "gemini" && !force) return cached;

  const article = getDreamBySlug(slug);
  if (!article) {
    return (
      cached ||
      ({
        omen: "심리몽",
        headline: "꿈의 결을 읽는 중",
        summaryBox: "해몽 데이터를 준비하지 못했습니다.",
        symbolism: "잠시 후 다시 시도해 주세요.",
        details: [],
        psychology: "",
        careTip: "아이와 짧은 시간을 보내 보세요.",
        quote: "",
        generatedAt: new Date().toISOString(),
        source: "fallback",
      } satisfies DreamLongform)
    );
  }

  const generated = await generateDreamLongformWithGemini({
    animalLabel: animalLabel(article.animal),
    situationLabel: situationLabel(article.situationId),
    seoTitle: article.title,
    seedSummary: article.summary,
  });

  if (generated.ok) {
    await writeLocal(slug, generated.data);
    await writeR2(slug, generated.data);
    return generated.data;
  }

  console.error("[dream-longform]", slug, generated.error);
  if (cached) return cached;
  const fallback = fallbackFromCatalog(slug)!;
  await writeLocal(slug, fallback);
  return fallback;
}
