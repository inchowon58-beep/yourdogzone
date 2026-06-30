"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { BreedForm } from "@/components/breed/BreedForm";
import { breedDetailPath } from "@/lib/breeds/config";
import { breedToFormData, formDataToInsert } from "@/lib/breeds/form-utils";

type Props = {
  slug: string;
  adminSecret: string;
  onCancel: () => void;
  onSaved: () => void;
};

export function BreedEditPanel({ slug, adminSecret, onCancel, onSaved }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [initial, setInitial] = useState<ReturnType<typeof breedToFormData> | null>(null);
  const [source, setSource] = useState<"seed" | "r2">("seed");

  const loadBreed = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/breeds/admin/${encodeURIComponent(slug)}`, {
        headers: { "x-admin-secret": adminSecret },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "견종 정보를 불러오지 못했습니다.");
        return;
      }
      setInitial(breedToFormData(data.breed));
      setSource(data.source === "r2" ? "r2" : "seed");
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [slug, adminSecret]);

  useEffect(() => {
    void loadBreed();
  }, [loadBreed]);

  async function handleSubmit(form: ReturnType<typeof breedToFormData>) {
    setSaving(true);
    setError("");
    try {
      const payload = formDataToInsert(form, slug);
      const res = await fetch(`/api/breeds/admin/${encodeURIComponent(slug)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminSecret,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "저장에 실패했습니다.");
        return;
      }
      setSaved(true);
      onSaved();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
        불러오는 중…
      </div>
    );
  }

  if (!initial) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50/50 p-6 text-center">
        <p className="text-sm text-red-600">{error || "견종을 찾을 수 없습니다."}</p>
        <button
          type="button"
          onClick={onCancel}
          className="mt-4 text-sm text-primary underline"
        >
          목록으로
        </button>
      </div>
    );
  }

  if (saved) {
    return (
      <div className="rounded-2xl border border-green-100 bg-green-50/50 p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <Check className="h-6 w-6 text-green-600" />
        </div>
        <h2 className="text-lg font-semibold">저장 완료</h2>
        <p className="mt-2 text-sm text-muted">
          {initial.name_ko} 정보가 저장되었습니다.
          {source === "seed" && " (시드 데이터가 R2에 반영됨)"}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href={breedDetailPath(slug)}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white"
          >
            상세 페이지 보기
          </Link>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm"
          >
            목록으로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{initial.name_ko} 수정</h2>
          <p className="mt-1 text-sm text-muted">
            텍스트·사진을 수정한 뒤 저장하면 상세 페이지에 반영됩니다.
          </p>
        </div>
        <Link
          href={breedDetailPath(slug)}
          className="text-sm text-primary hover:underline"
          target="_blank"
        >
          미리보기 ↗
        </Link>
      </div>

      <BreedForm
        key={slug}
        initial={initial}
        fixedSlug={slug}
        submitLabel="저장하기"
        loading={saving}
        error={error}
        onErrorClear={() => setError("")}
        onSubmit={handleSubmit}
        onCancel={onCancel}
      />
    </div>
  );
}
