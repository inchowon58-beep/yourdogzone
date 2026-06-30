"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, Upload } from "lucide-react";
import {
  BREED_KIND_LABELS,
  BREED_SIZE_GROUPS,
  BREED_SIZE_LABELS,
  breedDetailPath,
} from "@/lib/breeds/config";
import { generateBreedSlug } from "@/lib/breeds/slug";
import { uploadImageToR2, uploadToPresignedUrl } from "@/lib/upload/r2-client";
import type { BreedKind, BreedSizeGroup } from "@/lib/types/breed";

type FormData = {
  name_ko: string;
  name_en: string;
  kind: BreedKind;
  size_group: BreedSizeGroup;
  origin: string;
  summary: string;
  history: string;
  personality: string;
  appearance: string;
  grooming: string;
  exercise: string;
  health: string;
  training: string;
  living: string;
  lifespan: string;
  weight: string;
  height: string;
  tags: string;
  hero_image: string;
  gallery_images: string[];
};

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm outline-none transition focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/10";

const textareaClass = `${inputClass} min-h-[100px] resize-y`;

const STEPS = ["기본 정보", "성격·외모", "관리·건강", "사육·통계", "사진"];

export function BreedRegisterForm() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>({
    name_ko: "",
    name_en: "",
    kind: "purebred",
    size_group: "small",
    origin: "",
    summary: "",
    history: "",
    personality: "",
    appearance: "",
    grooming: "",
    exercise: "",
    health: "",
    training: "",
    living: "",
    lifespan: "",
    weight: "",
    height: "",
    tags: "",
    hero_image: "",
    gallery_images: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ slug: string } | null>(null);

  function update<K extends keyof FormData>(field: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleHeroUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const res = await uploadImageToR2(file);
    if (res.ok) update("hero_image", res.url);
    else setError(res.error);
    setLoading(false);
    e.target.value = "";
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setLoading(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const res = await uploadImageToR2(file);
      if (res.ok) urls.push(res.url);
    }
    if (urls.length) update("gallery_images", [...form.gallery_images, ...urls]);
    setLoading(false);
    e.target.value = "";
  }

  function removeGalleryImage(url: string) {
    update(
      "gallery_images",
      form.gallery_images.filter((u) => u !== url)
    );
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      const slug = generateBreedSlug(form.name_ko, form.name_en);
      const payload = {
        slug,
        name_ko: form.name_ko.trim(),
        name_en: form.name_en.trim(),
        kind: form.kind,
        size_group: form.size_group,
        size_label: BREED_SIZE_LABELS[form.size_group],
        origin: form.origin.trim(),
        summary: form.summary.trim(),
        history: form.history.trim(),
        personality: form.personality.trim(),
        appearance: form.appearance.trim(),
        grooming: form.grooming.trim(),
        exercise: form.exercise.trim(),
        health: form.health.trim(),
        training: form.training.trim(),
        living: form.living.trim(),
        lifespan: form.lifespan.trim(),
        weight: form.weight.trim(),
        height: form.height.trim(),
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        hero_image:
          form.hero_image.startsWith("http") ? form.hero_image : null,
        gallery_images: form.gallery_images.length ? form.gallery_images : null,
      };

      const res = await fetch("/api/breeds/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "등록에 실패했습니다.");
        return;
      }

      if (Array.isArray(data.uploads)) {
        for (const task of data.uploads) {
          const up = await uploadToPresignedUrl(
            task.uploadUrl,
            task.body,
            task.contentType
          );
          if (!up.ok) {
            setError(up.error);
            return;
          }
        }
      }

      setResult({ slug: data.slug });
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="rounded-2xl border border-green-100 bg-green-50/50 p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <Check className="h-6 w-6 text-green-600" />
        </div>
        <h2 className="text-lg font-semibold">등록 완료</h2>
        <p className="mt-2 text-sm text-muted">견종 상세 페이지가 생성되었습니다.</p>
        <Link
          href={breedDetailPath(result.slug)}
          className="mt-6 inline-block rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white"
        >
          상세 페이지 보기
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex gap-1">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={`flex-1 rounded-lg py-2 text-center text-xs font-medium ${
              i === step
                ? "bg-primary text-white"
                : i < step
                  ? "bg-primary/10 text-primary"
                  : "bg-gray-100 text-muted"
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      {error && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {step === 0 && (
        <div className="space-y-4">
          <Field label="한글 견종명 *">
            <input
              className={inputClass}
              value={form.name_ko}
              onChange={(e) => update("name_ko", e.target.value)}
              placeholder="예: 말티푸"
            />
          </Field>
          <Field label="영문 견종명">
            <input
              className={inputClass}
              value={form.name_en}
              onChange={(e) => update("name_en", e.target.value)}
              placeholder="예: Maltipoo"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="종류">
              <select
                className={inputClass}
                value={form.kind}
                onChange={(e) => update("kind", e.target.value as BreedKind)}
              >
                {Object.entries(BREED_KIND_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="크기">
              <select
                className={inputClass}
                value={form.size_group}
                onChange={(e) => update("size_group", e.target.value as BreedSizeGroup)}
              >
                {BREED_SIZE_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {BREED_SIZE_LABELS[g]}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="원산지">
            <input
              className={inputClass}
              value={form.origin}
              onChange={(e) => update("origin", e.target.value)}
              placeholder="예: 미국(교배견)"
            />
          </Field>
          <Field label="한 줄 소개 *">
            <textarea
              className={textareaClass}
              value={form.summary}
              onChange={(e) => update("summary", e.target.value)}
              placeholder="견종을 한 문단으로 소개해 주세요."
            />
          </Field>
          <Field label="태그 (쉼표 구분)">
            <input
              className={inputClass}
              value={form.tags}
              onChange={(e) => update("tags", e.target.value)}
              placeholder="예: 말티즈믹스, 실내견"
            />
          </Field>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <Field label="유래·역사">
            <textarea className={textareaClass} value={form.history} onChange={(e) => update("history", e.target.value)} />
          </Field>
          <Field label="성격">
            <textarea className={textareaClass} value={form.personality} onChange={(e) => update("personality", e.target.value)} />
          </Field>
          <Field label="외모·특징">
            <textarea className={textareaClass} value={form.appearance} onChange={(e) => update("appearance", e.target.value)} />
          </Field>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <Field label="털 관리·미용">
            <textarea className={textareaClass} value={form.grooming} onChange={(e) => update("grooming", e.target.value)} />
          </Field>
          <Field label="운동량">
            <textarea className={textareaClass} value={form.exercise} onChange={(e) => update("exercise", e.target.value)} />
          </Field>
          <Field label="건강·질병">
            <textarea className={textareaClass} value={form.health} onChange={(e) => update("health", e.target.value)} />
          </Field>
          <Field label="훈련">
            <textarea className={textareaClass} value={form.training} onChange={(e) => update("training", e.target.value)} />
          </Field>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <Field label="사육 환경">
            <textarea className={textareaClass} value={form.living} onChange={(e) => update("living", e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="수명">
              <input className={inputClass} value={form.lifespan} onChange={(e) => update("lifespan", e.target.value)} placeholder="12~15년" />
            </Field>
            <Field label="체중">
              <input className={inputClass} value={form.weight} onChange={(e) => update("weight", e.target.value)} placeholder="2~4kg" />
            </Field>
            <Field label="키(체고)">
              <input className={inputClass} value={form.height} onChange={(e) => update("height", e.target.value)} placeholder="20~25cm" />
            </Field>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6">
          <p className="text-sm text-muted">
            사진은 선택 사항입니다. 나중에 관리 페이지에서도 추가할 수 있습니다.
          </p>
          <Field label="대표 사진">
            {form.hero_image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.hero_image} alt="대표" className="mb-2 h-32 rounded-xl object-cover" />
            )}
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-8 text-sm text-muted hover:border-primary/30">
              <Upload className="h-4 w-4" />
              대표 사진 추가
              <input type="file" accept="image/*" className="hidden" onChange={handleHeroUpload} />
            </label>
          </Field>
          <Field label="갤러리 사진">
            {form.gallery_images.length > 0 && (
              <div className="mb-3 grid grid-cols-3 gap-2">
                {form.gallery_images.map((url) => (
                  <div key={url} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-20 w-full rounded-lg object-cover" />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(url)}
                      className="absolute right-1 top-1 rounded bg-black/50 px-1.5 text-xs text-white"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            )}
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-8 text-sm text-muted hover:border-primary/30">
              <Upload className="h-4 w-4" />
              사진 추가
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryUpload} />
            </label>
          </Field>
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          disabled={step === 0 || loading}
          onClick={() => setStep((s) => s - 1)}
          className="inline-flex items-center gap-1 rounded-xl px-4 py-2.5 text-sm text-muted disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          이전
        </button>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            disabled={loading || (step === 0 && !form.name_ko.trim())}
            onClick={() => setStep((s) => s + 1)}
            className="inline-flex items-center gap-1 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            다음
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            disabled={loading || !form.name_ko.trim() || !form.summary.trim()}
            onClick={() => void handleSubmit()}
            className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            {loading ? "등록 중…" : "등록하기"}
          </button>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
