"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Bell } from "lucide-react";
import type { CareShelterNotification } from "@/lib/types/care-shelter-partner";
import { CarePushSubscribeButton } from "@/components/care-matching/CarePushSubscribeButton";

type Partner = {
  id: string;
  shelter_name: string;
  contact_name: string;
  phone: string;
  status: string;
};

type Props = {
  initialMode?: "login" | "register";
};

export function CareShelterPartnerPortal({ initialMode = "login" }: Props) {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [notifications, setNotifications] = useState<CareShelterNotification[]>(
    []
  );

  const loadSession = useCallback(async () => {
    const res = await fetch("/api/auth/session", {
      credentials: "include",
    });
    const data = await res.json();
    setPartner(data.partner ?? null);
    setLoading(false);
  }, []);

  const loadNotifications = useCallback(async () => {
    const res = await fetch("/api/care-matching/partner/notifications");
    if (!res.ok) return;
    const data = await res.json();
    setNotifications(data.notifications ?? []);
  }, []);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (partner) void loadNotifications();
  }, [partner, loadNotifications]);

  async function logout() {
    await fetch("/api/care-matching/partner/logout", { method: "POST" });
    setPartner(null);
    setNotifications([]);
    window.dispatchEvent(new Event("auth-changed"));
  }

  if (loading) {
    return <p className="text-sm text-muted">불러오는 중…</p>;
  }

  if (partner) {
    const unread = notifications.filter((n) => !n.read_at).length;
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
          <p className="text-sm font-bold text-emerald-900">
            {partner.shelter_name}
          </p>
          <p className="mt-1 text-xs text-emerald-800/80">
            {partner.contact_name} · 로그인됨
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/care-matching/list"
              className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white"
            >
              제안 가능 리스트
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold"
            >
              로그아웃
            </button>
          </div>
        </div>

        <CarePushSubscribeButton />

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[var(--card-shadow)]">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" aria-hidden />
            <h2 className="text-sm font-bold">알림</h2>
            {unread > 0 && (
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                {unread}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted">
            홈 화면에 추가(PWA) 후 푸시 알림을 켜면, 새 매칭이 시작될 때
            휴대폰 알림으로 바로 확인할 수 있습니다.
          </p>
          {notifications.length === 0 ? (
            <p className="mt-4 text-sm text-muted">알림이 없습니다.</p>
          ) : (
            <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto">
              {notifications.slice(0, 20).map((n) => (
                <li
                  key={n.id}
                  className={`rounded-xl border px-3 py-2.5 text-xs ${
                    n.read_at
                      ? "border-gray-100 bg-gray-50"
                      : "border-primary/20 bg-primary/5"
                  }`}
                >
                  <p className="font-semibold text-foreground">{n.title}</p>
                  <p className="mt-0.5 text-muted">{n.body}</p>
                  {n.application_id && (
                    <Link
                      href="/care-matching/list"
                      className="mt-1 inline-block font-semibold text-primary"
                    >
                      리스트에서 보기 →
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <PwaInstallHint />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`flex-1 rounded-xl py-2 text-sm font-semibold ${
            mode === "login"
              ? "bg-primary text-white"
              : "border border-gray-200 bg-white"
          }`}
        >
          로그인
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`flex-1 rounded-xl py-2 text-sm font-semibold ${
            mode === "register"
              ? "bg-primary text-white"
              : "border border-gray-200 bg-white"
          }`}
        >
          회원가입
        </button>
      </div>
      {mode === "login" ? (
        <LoginForm onSuccess={loadSession} />
      ) : (
        <RegisterForm onSuccess={() => setMode("login")} />
      )}
      <PwaInstallHint />
    </div>
  );
}

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        setError(data.error ?? "로그인 실패");
        return;
      }
      window.dispatchEvent(new Event("auth-changed"));
      onSuccess();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[var(--card-shadow)]"
    >
      <p className="text-sm text-muted">
        승인된 보호소 파트너만 로그인할 수 있습니다.
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
        className="mt-4 h-11 w-full rounded-xl bg-primary text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? "로그인 중…" : "로그인"}
      </button>
    </form>
  );
}

function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({
    shelter_name: "",
    contact_name: "",
    phone: "",
    email: "",
    address: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/care-matching/partner/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "가입 실패");
        return;
      }
      setDone(data.message);
      onSuccess();
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 text-sm">
        {done}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[var(--card-shadow)]"
    >
      <p className="text-sm text-muted">
        사설보호소·입양센터 등 입소 가능 시설을 위한 파트너 회원가입입니다.
      </p>
      <div className="mt-4 space-y-3">
        {(
          [
            ["shelter_name", "보호소명", "text"],
            ["contact_name", "담당자명", "text"],
            ["phone", "연락처", "tel"],
            ["email", "이메일", "email"],
            ["address", "주소", "text"],
            ["password", "비밀번호 (6자 이상)", "password"],
          ] as const
        ).map(([key, label, type]) => (
          <label key={key} className="block">
            <span className="mb-1 block text-xs font-semibold">{label}</span>
            <input
              required
              type={type}
              value={form[key]}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, [key]: e.target.value }))
              }
              className={inputCls}
            />
          </label>
        ))}
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="mt-4 h-11 w-full rounded-xl bg-primary text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? "가입 중…" : "파트너 가입 신청"}
      </button>
    </form>
  );
}

function PwaInstallHint() {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-xs text-muted">
      <p className="font-semibold text-foreground">앱처럼 설치하기</p>
      <p className="mt-1">
        iPhone: Safari 공유 → 홈 화면에 추가 · Android: Chrome 메뉴 → 홈
        화면에 추가
      </p>
    </div>
  );
}

const inputCls =
  "h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-primary/40";
