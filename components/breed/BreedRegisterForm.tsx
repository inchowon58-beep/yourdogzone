"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { BreedForm } from "@/components/breed/BreedForm";
import { breedDetailPath } from "@/lib/breeds/config";
import { EMPTY_BREED_FORM, formDataToInsert } from "@/lib/breeds/form-utils";
import { uploadToPresignedUrl } from "@/lib/upload/r2-client";
import type { BreedFormData } from "@/lib/breeds/form-utils";

export function BreedRegisterForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ slug: string } | null>(null);

  async function handleSubmit(form: BreedFormData) {
    setLoading(true);
    setError("");
    try {
      const payload = formDataToInsert(form);

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
    <BreedForm
      initial={EMPTY_BREED_FORM}
      submitLabel="등록하기"
      loading={loading}
      error={error}
      onErrorClear={() => setError("")}
      onSubmit={handleSubmit}
    />
  );
}
