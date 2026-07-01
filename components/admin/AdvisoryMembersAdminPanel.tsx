"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { uploadImageToR2 } from "@/lib/upload/r2-client";
import type { AdvisoryMember } from "@/lib/types/advisory-member";

const EMPTY_FORM = {
  id: "",
  name: "",
  category: "훈련/행정 부문",
  title: "한국애견연맹 ",
  description: "",
  profilePhotoUrl: "",
  kakaoUrl: "",
  isPublished: true,
};

export function AdvisoryMembersAdminPanel() {
  const [members, setMembers] = useState<AdvisoryMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/advisory-members");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "불러오기 실패");
      setMembers(data.members ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function editMember(member: AdvisoryMember) {
    setForm({
      id: member.id,
      name: member.name,
      category: member.category,
      title: member.title,
      description: member.description ?? "",
      profilePhotoUrl: member.profilePhotoUrl ?? "",
      kakaoUrl: member.kakaoUrl ?? "",
      isPublished: member.isPublished,
    });
    setMessage("");
    setError("");
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setMessage("");
    setError("");
  }

  async function handlePhotoUpload(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const result = await uploadImageToR2(file);
      if (!result.ok) throw new Error(result.error);
      setForm((prev) => ({ ...prev, profilePhotoUrl: result.url }));
      setMessage("프로필 사진이 업로드되었습니다.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "업로드 실패");
    } finally {
      setUploading(false);
    }
  }

  async function saveMember() {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const payload = {
        member: {
          id: form.id || undefined,
          sortOrder: form.id
            ? members.find((m) => m.id === form.id)?.sortOrder ?? members.length
            : members.length,
          isPublished: form.isPublished,
          name: form.name,
          category: form.category,
          title: form.title,
          description: form.description || undefined,
          profilePhotoUrl: form.profilePhotoUrl || undefined,
          kakaoUrl: form.kakaoUrl || undefined,
        },
      };

      const res = await fetch("/api/admin/advisory-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "저장 실패");

      setMessage(form.id ? "수정되었습니다." : "추가되었습니다.");
      resetForm();
      void load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류");
    } finally {
      setSaving(false);
    }
  }

  async function deleteMember(id: string) {
    if (!confirm("이 위원을 삭제할까요?")) return;
    setError("");
    try {
      const res = await fetch("/api/admin/advisory-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "삭제 실패");
      setMessage("삭제되었습니다.");
      if (form.id === id) resetForm();
      void load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류");
    }
  }

  async function moveMember(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= members.length) return;
    const orderedIds = members.map((m) => m.id);
    [orderedIds[index], orderedIds[target]] = [
      orderedIds[target],
      orderedIds[index],
    ];

    try {
      const res = await fetch("/api/admin/advisory-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reorder", orderedIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "순서 변경 실패");
      void load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류");
    }
  }

  async function togglePublish(member: AdvisoryMember) {
    try {
      const res = await fetch("/api/admin/advisory-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member: { ...member, isPublished: !member.isPublished },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "변경 실패");
      void load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류");
    }
  }

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[var(--card-shadow)] sm:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">공식 자문단 위원장 관리</h2>
          <p className="mt-1 text-sm text-muted">
            프로필·직함·노출 순서를 관리합니다. 공개 페이지에 반영됩니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            새로고침
          </button>
          <Link
            href="/services/academy/advisory"
            target="_blank"
            className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm"
          >
            <ExternalLink className="h-4 w-4" />
            공개 페이지
          </Link>
        </div>
      </div>

      {message ? (
        <p className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mb-8 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 sm:p-5">
        <h3 className="text-sm font-semibold">
          {form.id ? "위원 수정" : "위원 추가"}
        </h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-muted">성함</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              placeholder="예: 조춘원"
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted">부문</span>
            <input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              placeholder="예: 훈련/행정 부문"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-muted">직함 *</span>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              placeholder="예: 한국애견연맹 훈련사 위원장"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-muted">소개 문구</span>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={2}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              placeholder="간단한 자문 소개"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-muted">카카오 1:1 상담 URL</span>
            <input
              value={form.kakaoUrl}
              onChange={(e) => setForm({ ...form, kakaoUrl: e.target.value })}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              placeholder="https://open.kakao.com/..."
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-muted">프로필 사진</span>
            <input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={(e) =>
                void handlePhotoUpload(e.target.files?.[0] ?? null)
              }
              className="mt-1 block w-full text-sm"
            />
            {form.profilePhotoUrl ? (
              <p className="mt-1 break-all text-xs text-muted">
                {form.profilePhotoUrl}
              </p>
            ) : null}
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) =>
                setForm({ ...form, isPublished: e.target.checked })
              }
            />
            공개 노출
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void saveMember()}
            disabled={saving}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
          >
            <Save className="h-4 w-4" />
            {form.id ? "수정 저장" : "추가"}
          </button>
          {form.id ? (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1 rounded-lg border px-4 py-2 text-sm"
            >
              <Plus className="h-4 w-4" />
              새로 추가
            </button>
          ) : null}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b text-muted">
              <th className="px-2 py-2">순서</th>
              <th className="px-2 py-2">성함</th>
              <th className="px-2 py-2">직함</th>
              <th className="px-2 py-2">부문</th>
              <th className="px-2 py-2">사진</th>
              <th className="px-2 py-2">공개</th>
              <th className="px-2 py-2">관리</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member, index) => (
              <tr key={member.id} className="border-b align-top">
                <td className="px-2 py-3">
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-xs">{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => void moveMember(index, -1)}
                      disabled={index === 0}
                      className="rounded border p-1 disabled:opacity-30"
                      aria-label="위로"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void moveMember(index, 1)}
                      disabled={index === members.length - 1}
                      className="rounded border p-1 disabled:opacity-30"
                      aria-label="아래로"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
                <td className="px-2 py-3">{member.name || "—"}</td>
                <td className="px-2 py-3">{member.title}</td>
                <td className="px-2 py-3">{member.category}</td>
                <td className="px-2 py-3">
                  {member.profilePhotoUrl ? "있음" : "없음"}
                </td>
                <td className="px-2 py-3">
                  <button
                    type="button"
                    onClick={() => void togglePublish(member)}
                    className="inline-flex items-center gap-1 text-xs"
                  >
                    {member.isPublished ? (
                      <>
                        <Eye className="h-3.5 w-3.5" /> 공개
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3.5 w-3.5" /> 비공개
                      </>
                    )}
                  </button>
                </td>
                <td className="px-2 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => editMember(member)}
                      className="text-primary hover:underline"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteMember(member.id)}
                      className="inline-flex items-center gap-1 text-red-600 hover:underline"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      삭제
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {members.length === 0 && !loading ? (
          <p className="py-8 text-center text-sm text-muted">
            등록된 위원이 없습니다. 위 폼에서 추가하세요.
          </p>
        ) : null}
      </div>
    </section>
  );
}
