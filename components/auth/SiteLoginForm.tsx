"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export function SiteLoginForm() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (data.admin) {
          router.replace("/admin");
        } else if (data.partner) {
          router.replace("/care-matching/list");
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/care-matching/partner/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "로그인에 실패했습니다.");
        return;
      }
      window.dispatchEvent(new Event("auth-changed"));
      router.push("/care-matching/list");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return <p className="text-sm text-muted">확인 중…</p>;
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-gray-100 bg-white p-6 shadow-[var(--card-shadow)]"
      >
        <h2 className="text-lg font-bold text-foreground">보호소 파트너 로그인</h2>
        <p className="mt-1 text-sm text-muted">
          승인된 보호소 계정으로 로그인하면 매칭 리스트·돌봄비용 제안·사진
          확인이
          가능합니다.
        </p>
        <div className="mt-4 space-y-3">
          <input
            required
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="연락처"
            className={inputCls}
          />
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            className={inputCls}
          />
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              로그인 중…
            </>
          ) : (
            "로그인"
          )}
        </button>
      </form>

      <div className="rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4 text-sm">
        <p className="font-semibold text-foreground">관리자이신가요?</p>
        <p className="mt-1 text-muted">
          관리자 계정은 별도 로그인 페이지에서 접속합니다. 로그인 시 모든
          신청·사진·상태를 확인할 수 있습니다.
        </p>
        <Link
          href="/admin/login"
          className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline"
        >
          관리자 로그인 →
        </Link>
      </div>

      <p className="text-center text-sm text-muted">
        계정이 없으신가요?{" "}
        <Link href="/signup" className="font-semibold text-primary hover:underline">
          보호소 파트너 회원가입
        </Link>
      </p>
    </div>
  );
}

const inputCls =
  "h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-primary/40";
