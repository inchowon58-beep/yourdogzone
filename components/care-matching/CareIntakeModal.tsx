"use client";

import { FormEvent, useEffect, useId, useState, type ReactNode } from "react";
import Link from "next/link";
import { Loader2, Upload, X } from "lucide-react";
import { uploadImageToR2 } from "@/lib/upload/r2-client";
import type { CareChipType, CareSpecies } from "@/lib/types/care-intake";

type Props = {
  open: boolean;
  onClose: () => void;
};

type TriBool = "" | "true" | "false";

const emptyForm = {
  species: "dog" as CareSpecies,
  breed: "",
  pet_name: "",
  weight_kg: "",
  age_text: "",
  gender: "",
  neutered: "" as TriBool,
  vaccinated: "" as TriBool,
  chip_type: "unknown" as CareChipType,
  medical_history: "",
  current_illness: "",
  personality: "",
  surrender_reason: "",
  excluded_shelters: "",
  notes: "",
  guardian_name: "",
  guardian_phone: "",
  guardian_address: "",
  portal_password: "",
  matching_hours: "24" as "12" | "24" | "36" | "48",
};

export function CareIntakeModal({ open, onClose }: Props) {
  const titleId = useId();
  const [form, setForm] = useState(emptyForm);
  const [photos, setPhotos] = useState<(File | null)[]>([null, null]);
  const [previews, setPreviews] = useState<(string | null)[]>([null, null]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    return () => {
      previews.forEach((p) => p && URL.revokeObjectURL(p));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!open) return null;

  function setField<K extends keyof typeof emptyForm>(
    key: K,
    value: (typeof emptyForm)[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onPickPhoto(index: 0 | 1, file: File | null) {
    setPhotos((prev) => {
      const next = [...prev] as (File | null)[];
      next[index] = file;
      return next;
    });
    setPreviews((prev) => {
      const next = [...prev] as (string | null)[];
      if (prev[index]) URL.revokeObjectURL(prev[index]!);
      next[index] = file ? URL.createObjectURL(file) : null;
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!photos[0] || !photos[1]) {
      setError("사진 2장을 모두 등록해 주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const uploaded: string[] = [];
      for (const file of photos) {
        if (!file) continue;
        const res = await uploadImageToR2(file);
        if (!res.ok) {
          setError(res.error);
          setSubmitting(false);
          return;
        }
        uploaded.push(res.url);
      }

      const res = await fetch("/api/care-matching/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          species: form.species,
          photo_urls: uploaded,
          breed: form.breed,
          pet_name: form.pet_name,
          weight_kg: form.weight_kg === "" ? null : Number(form.weight_kg),
          age_text: form.age_text || null,
          gender: form.gender || null,
          neutered:
            form.neutered === "" ? null : form.neutered === "true",
          vaccinated:
            form.vaccinated === "" ? null : form.vaccinated === "true",
          chip_type: form.chip_type,
          medical_history: form.medical_history || null,
          current_illness: form.current_illness || null,
          personality: form.personality || null,
          surrender_reason: form.surrender_reason || null,
          excluded_shelters: form.excluded_shelters || null,
          notes: form.notes || null,
          guardian_name: form.guardian_name,
          guardian_phone: form.guardian_phone,
          guardian_address: form.guardian_address,
          portal_password: form.portal_password,
          matching_hours: Number(form.matching_hours),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "신청에 실패했습니다.");
        setSubmitting(false);
        return;
      }

      setDone(true);
      setForm(emptyForm);
      setPhotos([null, null]);
      setPreviews([null, null]);
    } catch {
      setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="닫기"
        onClick={onClose}
      />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:max-h-[90vh] sm:rounded-2xl">
        <div className="relative bg-[#1B6B4A] px-5 py-5 text-white sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-lg p-1.5 text-white/80 hover:bg-white/15 hover:text-white"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
          <p className="text-[11px] font-semibold tracking-wide text-white/80">
            유아독존 안심입소 매칭
          </p>
          <h2
            id={titleId}
            className="mt-1 pr-8 text-lg font-black leading-snug tracking-tight sm:text-xl"
          >
            최저비용 입소를 위한
            <br />
            안심입소 신청
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-white/85">
            등록 후{" "}
            <strong className="font-semibold text-white">
              책임 접수비(5만 원) 계좌 입금
            </strong>
            이 확인되면, 전국 사설보호소에 정보가 전달되고 안심 돌봄 분담금
            제안이 시작됩니다.
          </p>
        </div>

        {done ? (
          <div className="space-y-4 overflow-y-auto px-5 py-8">
            <p className="text-base font-bold text-foreground">
              신청이 접수되었습니다
            </p>
            <p className="text-sm leading-relaxed text-muted">
              책임 접수비 입금 안내를 확인해 주세요. 입금이 확인되는 즉시
              사설보호소들에 정보가 전달되며, 전국 보호소에서 입소 가능한
              분담금을 제시합니다.
            </p>
            <p className="text-xs text-muted">
              <Link
                href="/care-matching/my"
                className="font-semibold text-primary hover:underline"
              >
                나의 안심입소 신청내역
              </Link>
              에서 조회 비밀번호로 제안 현황을 확인할 수 있습니다.
            </p>
            <div className="rounded-xl bg-primary/5 px-4 py-3 text-sm text-foreground">
              <p className="font-semibold">입금 안내 (책임 접수비 5만 원)</p>
              <p className="mt-1 text-muted">
                입금 계좌는 신청 확인 연락 또는 관리자 안내를 통해
                전달됩니다. 입금자명은 보호자 성함과 동일하게 해 주세요.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-white hover:bg-primary-hover"
            >
              확인
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
              <fieldset>
                <legend className="mb-2 text-sm font-bold text-foreground">
                  동물 구분
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ["dog", "강아지"],
                      ["cat", "고양이"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setField("species", value)}
                      className={`h-11 rounded-xl border text-sm font-semibold transition ${
                        form.species === value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-gray-200 text-foreground hover:border-gray-300"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-2 text-sm font-bold text-foreground">
                  사진 2장 <span className="text-red-500">*</span>
                </legend>
                <div className="grid grid-cols-2 gap-3">
                  {([0, 1] as const).map((i) => (
                    <label
                      key={i}
                      className="relative flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50 text-center hover:border-primary/40"
                    >
                      {previews[i] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={previews[i]!}
                          alt={`미리보기 ${i + 1}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <>
                          <Upload className="h-5 w-5 text-muted" />
                          <span className="mt-1 text-xs text-muted">
                            사진 {i + 1}
                          </span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="absolute inset-0 opacity-0"
                        onChange={(ev) =>
                          onPickPhoto(i, ev.target.files?.[0] ?? null)
                        }
                      />
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field
                  label={form.species === "dog" ? "견종" : "묘종"}
                  required
                >
                  <input
                    required
                    value={form.breed}
                    onChange={(e) => setField("breed", e.target.value)}
                    className={inputCls}
                    placeholder={
                      form.species === "dog" ? "예: 말티즈" : "예: 코리안숏헤어"
                    }
                  />
                </Field>
                <Field label="이름" required>
                  <input
                    required
                    value={form.pet_name}
                    onChange={(e) => setField("pet_name", e.target.value)}
                    className={inputCls}
                    placeholder="아이 이름"
                  />
                </Field>
                <Field label="몸무게 (kg)">
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={form.weight_kg}
                    onChange={(e) => setField("weight_kg", e.target.value)}
                    className={inputCls}
                    placeholder="예: 3.5"
                  />
                </Field>
                <Field label="나이">
                  <input
                    value={form.age_text}
                    onChange={(e) => setField("age_text", e.target.value)}
                    className={inputCls}
                    placeholder="예: 2살 / 8개월"
                  />
                </Field>
                <Field label="성별">
                  <select
                    value={form.gender}
                    onChange={(e) => setField("gender", e.target.value)}
                    className={inputCls}
                  >
                    <option value="">선택</option>
                    <option value="male">수컷</option>
                    <option value="female">암컷</option>
                    <option value="unknown">모름</option>
                  </select>
                </Field>
                <Field label="중성화 여부">
                  <select
                    value={form.neutered}
                    onChange={(e) =>
                      setField("neutered", e.target.value as TriBool)
                    }
                    className={inputCls}
                  >
                    <option value="">선택</option>
                    <option value="true">완료</option>
                    <option value="false">미완료</option>
                  </select>
                </Field>
                <Field label="접종 완료 여부">
                  <select
                    value={form.vaccinated}
                    onChange={(e) =>
                      setField("vaccinated", e.target.value as TriBool)
                    }
                    className={inputCls}
                  >
                    <option value="">선택</option>
                    <option value="true">완료</option>
                    <option value="false">미완료 / 일부</option>
                  </select>
                </Field>
                <Field
                  label={
                    form.species === "dog"
                      ? "동물등록 (외장/내장)"
                      : "등록·인식표"
                  }
                >
                  <select
                    value={form.chip_type}
                    onChange={(e) =>
                      setField("chip_type", e.target.value as CareChipType)
                    }
                    className={inputCls}
                  >
                    <option value="unknown">모름</option>
                    <option value="none">없음</option>
                    <option value="external">외장형</option>
                    <option value="internal">내장형</option>
                    <option value="both">외장형+내장형</option>
                  </select>
                </Field>
              </div>

              <Field label="질병 및 수술 관련 이력">
                <textarea
                  value={form.medical_history}
                  onChange={(e) => setField("medical_history", e.target.value)}
                  className={`${inputCls} min-h-[72px] resize-y`}
                  placeholder="수술·만성질환·투약 이력 등"
                />
              </Field>
              <Field label="현재 질병 유무">
                <textarea
                  value={form.current_illness}
                  onChange={(e) => setField("current_illness", e.target.value)}
                  className={`${inputCls} min-h-[64px] resize-y`}
                  placeholder="현재 치료 중이면 내용을 적어 주세요. 없으면 '없음'"
                />
              </Field>
              <Field label="성격">
                <textarea
                  value={form.personality}
                  onChange={(e) => setField("personality", e.target.value)}
                  className={`${inputCls} min-h-[64px] resize-y`}
                  placeholder="사람·다른 동물과의 성향, 분리불안 등"
                />
              </Field>
              <Field label="파양·입소 사유">
                <textarea
                  value={form.surrender_reason}
                  onChange={(e) => setField("surrender_reason", e.target.value)}
                  className={`${inputCls} min-h-[64px] resize-y`}
                  placeholder="불가피한 사정을 간단히 적어 주세요"
                />
              </Field>
              <Field label="제외하고 싶은 보호소 (선택)">
                <textarea
                  value={form.excluded_shelters}
                  onChange={(e) =>
                    setField("excluded_shelters", e.target.value)
                  }
                  className={`${inputCls} min-h-[64px] resize-y`}
                  placeholder="예: ○○보호소, △△센터 (쉼표로 구분)"
                />
              </Field>
              <p className="-mt-3 text-[11px] leading-relaxed text-muted">
                작성한 보호소명은 돌봄비용 제안이 제한됩니다. 여러 곳이면 쉼표로
                구분해 주세요.
              </p>

              <div className="border-t border-gray-100 pt-4">
                <p className="mb-3 text-sm font-bold text-foreground">
                  보호자 정보
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="보호자 이름" required>
                    <input
                      required
                      value={form.guardian_name}
                      onChange={(e) =>
                        setField("guardian_name", e.target.value)
                      }
                      className={inputCls}
                    />
                  </Field>
                  <Field label="보호자 연락처" required>
                    <input
                      required
                      type="tel"
                      value={form.guardian_phone}
                      onChange={(e) =>
                        setField("guardian_phone", e.target.value)
                      }
                      className={inputCls}
                      placeholder="010-0000-0000"
                    />
                  </Field>
                </div>
                <div className="mt-3">
                  <Field label="보호자 주소" required>
                    <input
                      required
                      value={form.guardian_address}
                      onChange={(e) =>
                        setField("guardian_address", e.target.value)
                      }
                      className={inputCls}
                      placeholder="시/군/구까지 포함"
                    />
                  </Field>
                </div>
                <div className="mt-3">
                  <Field label="기타 전달 사항">
                    <textarea
                      value={form.notes}
                      onChange={(e) => setField("notes", e.target.value)}
                      className={`${inputCls} min-h-[64px] resize-y`}
                      placeholder="급식·산책 습관, 주의사항 등"
                    />
                  </Field>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="mb-3 text-sm font-bold text-foreground">
                  매칭 설정
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="매칭 대기 시간" required>
                    <select
                      required
                      value={form.matching_hours}
                      onChange={(e) =>
                        setField(
                          "matching_hours",
                          e.target.value as typeof form.matching_hours
                        )
                      }
                      className={inputCls}
                    >
                      <option value="12">12시간</option>
                      <option value="24">24시간</option>
                      <option value="36">36시간</option>
                      <option value="48">48시간</option>
                    </select>
                  </Field>
                  <Field label="내역 조회 비밀번호" required>
                    <input
                      required
                      type="password"
                      minLength={4}
                      value={form.portal_password}
                      onChange={(e) =>
                        setField("portal_password", e.target.value)
                      }
                      className={inputCls}
                      placeholder="4자 이상"
                    />
                  </Field>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-muted">
                  심사승인 후 설정한 시간 동안 보호소의 돌봄비용 제안이
                  진행됩니다. 조회 비밀번호는{" "}
                  <strong className="font-semibold text-foreground">
                    나의 안심입소 신청내역
                  </strong>
                  에서 제안 현황 확인에 사용됩니다.
                </p>
              </div>

              {error && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}
            </div>

            <div className="border-t border-gray-100 px-5 py-4">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    신청 중…
                  </>
                ) : (
                  "안심입소 신청하기"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const inputCls =
  "h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-foreground">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
