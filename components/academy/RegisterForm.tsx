"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, Upload } from "lucide-react";
import { REGION_BIG_OPTIONS } from "@/lib/constants/regions";
import { uploadImageToR2, uploadToPresignedUrl } from "@/lib/upload/r2-client";

type FormData = {
  name: string;
  region_big: string;
  region_small: string;
  phone: string;
  address: string;
  title_copy: string;
  curriculum: string;
  tuition_info: string;
  kakao_url: string;
  logo_image: string;
  academy_images: string[];
};

const INITIAL: FormData = {
  name: "",
  region_big: "서울",
  region_small: "",
  phone: "",
  address: "",
  title_copy: "",
  curriculum: "",
  tuition_info: "",
  kakao_url: "",
  logo_image: "",
  academy_images: [],
};

const STEPS = ["기본 정보", "지역·연락처", "교육 정보", "이미지"];

export function RegisterForm() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ slug: string } | null>(null);

  function update(field: keyof FormData, value: string | string[]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError("");
    const result = await uploadImageToR2(file);
    if (result.ok) {
      update("logo_image", result.url);
    } else {
      setError(result.error);
    }
    setLoading(false);
    e.target.value = "";
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setLoading(true);
    setError("");
    const urls: string[] = [];
    const errors: string[] = [];

    for (const file of Array.from(files)) {
      const result = await uploadImageToR2(file);
      if (result.ok) {
        urls.push(result.url);
      } else {
        errors.push(`${file.name}: ${result.error}`);
      }
    }

    if (urls.length > 0) {
      update("academy_images", [...form.academy_images, ...urls]);
    }
    if (errors.length > 0) {
      setError(errors.join(" / "));
    }
    setLoading(false);
    e.target.value = "";
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/academy/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "등록에 실패했습니다.");
        return;
      }

      if (Array.isArray(data.uploads)) {
        for (const upload of data.uploads as Array<{
          uploadUrl: string;
          contentType: string;
          body: string;
        }>) {
          const putResult = await uploadToPresignedUrl(
            upload.uploadUrl,
            upload.body,
            upload.contentType
          );
          if (!putResult.ok) {
            setError(putResult.error);
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
    const detailPath = `/services/academy/${result.slug}`;

    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-[var(--card-shadow)]">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
          <Check className="h-7 w-7 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold">등록이 완료되었습니다!</h2>
        <p className="mt-2 text-sm text-muted">
          학원 상세 페이지가 생성되었습니다.
        </p>
        <p className="mt-4 break-all rounded-xl bg-gray-50 px-4 py-3 text-sm font-medium text-primary">
          {detailPath}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={detailPath}
            className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white"
          >
            상세 페이지 확인
          </Link>
          <Link
            href="/services/academy"
            className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold text-foreground"
          >
            학원 목록으로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-[var(--card-shadow)] sm:p-8">
      <div className="mb-8 flex gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                i <= step
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-muted"
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`text-xs ${i <= step ? "font-medium text-foreground" : "text-muted"}`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-5">
          <Field label="학원명" required>
            <input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="예) 강남펫뷰티아카데미"
              className={inputClass}
            />
          </Field>
          <Field label="상단 한줄 카피" required>
            <input
              value={form.title_copy}
              onChange={(e) => update("title_copy", e.target.value)}
              placeholder="예) 강남 최고의 애견미용 자격증 전문 학원"
              className={inputClass}
            />
          </Field>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="대분류 지역" required>
              <select
                value={form.region_big}
                onChange={(e) => update("region_big", e.target.value)}
                className={inputClass}
              >
                {REGION_BIG_OPTIONS.filter((r) => r !== "전체").map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="소분류 지역" required>
              <input
                value={form.region_small}
                onChange={(e) => update("region_small", e.target.value)}
                placeholder="예) 강남구"
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="대표 전화번호">
            <input
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="02-1234-5678"
              className={inputClass}
            />
          </Field>
          <Field label="상세 주소" required>
            <input
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              placeholder="서울특별시 강남구 ..."
              className={inputClass}
            />
          </Field>
          <Field label="카카오톡 상담 링크 (선택)">
            <input
              value={form.kakao_url}
              onChange={(e) => update("kakao_url", e.target.value)}
              placeholder="https://pf.kakao.com/..."
              className={inputClass}
            />
          </Field>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <Field label="교육 과정">
            <textarea
              value={form.curriculum}
              onChange={(e) => update("curriculum", e.target.value)}
              placeholder="자격증반, 취업반, 창업반 등"
              rows={4}
              className={inputClass}
            />
          </Field>
          <Field label="수강료 및 혜택">
            <textarea
              value={form.tuition_info}
              onChange={(e) => update("tuition_info", e.target.value)}
              placeholder="국비지원, 할인 혜택 등"
              rows={4}
              className={inputClass}
            />
          </Field>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <Field label="로고 / 대표 이미지">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-8 transition hover:border-primary/40 hover:bg-gray-50">
              <Upload className="mb-2 h-6 w-6 text-muted" />
              <span className="text-sm text-muted">클릭하여 업로드</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </label>
            {form.logo_image && (
              <p className="text-xs text-emerald-600">✓ 로고 업로드 완료</p>
            )}
          </Field>
          <Field label="상세 슬라이드 이미지">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-8 transition hover:border-primary/40 hover:bg-gray-50">
              <Upload className="mb-2 h-6 w-6 text-muted" />
              <span className="text-sm text-muted">
                여러 장 선택 가능 ({form.academy_images.length}장)
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleGalleryUpload}
              />
            </label>
          </Field>
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          className="flex items-center gap-1 rounded-xl px-4 py-2.5 text-sm font-medium text-muted disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          이전
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="flex items-center gap-1 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white"
          >
            다음
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !form.name || !form.address}
            className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "등록 중..." : "등록 완료"}
          </button>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm outline-none transition focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/10";
