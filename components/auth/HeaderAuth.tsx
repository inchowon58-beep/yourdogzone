"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import {
  clearAuthHintCookieClient,
  clearCachedHeaderSession,
  hasAuthHintCookie,
  readCachedHeaderSession,
  writeCachedHeaderSession,
  type HeaderAuthSession,
} from "@/lib/auth/header-auth-client";

const GUEST: HeaderAuthSession = { admin: false, partner: null };

async function fetchSession(): Promise<HeaderAuthSession> {
  const res = await fetch("/api/auth/session", {
    cache: "no-store",
    credentials: "include",
  });
  const data = await res.json();
  return {
    admin: Boolean(data.admin),
    partner: data.partner ?? null,
  };
}

export function HeaderAuth() {
  const [session, setSession] = useState<HeaderAuthSession>(GUEST);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (force = false) => {
    if (!hasAuthHintCookie()) {
      clearCachedHeaderSession();
      setSession(GUEST);
      setLoading(false);
      return;
    }

    if (!force) {
      const cached = readCachedHeaderSession();
      if (cached) {
        setSession(cached);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    try {
      const next = await fetchSession();
      if (!next.admin && !next.partner) {
        clearAuthHintCookieClient();
        clearCachedHeaderSession();
        setSession(GUEST);
        return;
      }
      writeCachedHeaderSession(next);
      setSession(next);
    } catch {
      setSession(GUEST);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const onAuthChange = () => {
      clearCachedHeaderSession();
      void load(true);
    };
    window.addEventListener("auth-changed", onAuthChange);
    return () => window.removeEventListener("auth-changed", onAuthChange);
  }, [load]);

  async function logout() {
    await Promise.all([
      fetch("/api/care-matching/partner/logout", {
        method: "POST",
        credentials: "include",
      }),
      fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
      }),
    ]);
    clearAuthHintCookieClient();
    clearCachedHeaderSession();
    setSession(GUEST);
    window.dispatchEvent(new Event("auth-changed"));
    window.location.href = "/";
  }

  if (loading) {
    return (
      <div className="hidden h-9 w-24 animate-pulse rounded-lg bg-gray-100 md:block" />
    );
  }

  const loggedIn = session.admin || session.partner;

  if (!loggedIn) {
    return (
      <div className="hidden items-center gap-2 md:flex">
        <Link
          href="/login"
          className="rounded-lg px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-gray-50"
        >
          로그인
        </Link>
        <Link
          href="/signup"
          className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover"
        >
          회원가입
        </Link>
      </div>
    );
  }

  return (
    <div className="hidden items-center gap-2 md:flex">
      {session.admin && (
        <Link
          href="/admin"
          className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
        >
          관리자
        </Link>
      )}
      {session.partner && (
        <Link
          href="/care-matching/list"
          className="max-w-[9rem] truncate rounded-lg bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/15"
          title={session.partner.shelter_name}
        >
          {session.partner.shelter_name}
        </Link>
      )}
      {!session.admin && session.partner && (
        <Link
          href="/care-matching/list"
          className="rounded-lg px-2 py-2 text-xs font-semibold text-muted hover:text-primary"
        >
          매칭 리스트
        </Link>
      )}
      <button
        type="button"
        onClick={() => void logout()}
        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-2 text-xs font-semibold text-muted hover:text-foreground"
        aria-label="로그아웃"
      >
        <LogOut className="h-3.5 w-3.5" aria-hidden />
        로그아웃
      </button>
    </div>
  );
}

export function MobileHeaderAuth({ onNavigate }: { onNavigate?: () => void }) {
  const [session, setSession] = useState<HeaderAuthSession>(GUEST);

  const load = useCallback(async (force = false) => {
    if (!hasAuthHintCookie()) {
      clearCachedHeaderSession();
      setSession(GUEST);
      return;
    }

    if (!force) {
      const cached = readCachedHeaderSession();
      if (cached) {
        setSession(cached);
        return;
      }
    }

    try {
      const next = await fetchSession();
      if (!next.admin && !next.partner) {
        clearAuthHintCookieClient();
        clearCachedHeaderSession();
        setSession(GUEST);
        return;
      }
      writeCachedHeaderSession(next);
      setSession(next);
    } catch {
      setSession(GUEST);
    }
  }, []);

  useEffect(() => {
    void load();
    const onAuthChange = () => {
      clearCachedHeaderSession();
      void load(true);
    };
    window.addEventListener("auth-changed", onAuthChange);
    return () => window.removeEventListener("auth-changed", onAuthChange);
  }, [load]);

  async function logout() {
    await Promise.all([
      fetch("/api/care-matching/partner/logout", { method: "POST" }),
      fetch("/api/admin/logout", { method: "POST" }),
    ]);
    clearAuthHintCookieClient();
    clearCachedHeaderSession();
    window.dispatchEvent(new Event("auth-changed"));
    onNavigate?.();
    window.location.href = "/";
  }

  const loggedIn = session.admin || session.partner;

  if (!loggedIn) {
    return (
      <li className="flex gap-2 pt-2">
        <Link
          href="/login"
          onClick={onNavigate}
          className="flex-1 rounded-xl border border-gray-200 py-3 text-center text-sm font-semibold"
        >
          로그인
        </Link>
        <Link
          href="/signup"
          onClick={onNavigate}
          className="flex-1 rounded-xl bg-primary py-3 text-center text-sm font-semibold text-white"
        >
          회원가입
        </Link>
      </li>
    );
  }

  return (
    <>
      {session.admin && (
        <li>
          <Link
            href="/admin"
            onClick={onNavigate}
            className="block rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"
          >
            관리자 페이지
          </Link>
        </li>
      )}
      {session.partner && (
        <li>
          <Link
            href="/care-matching/list"
            onClick={onNavigate}
            className="block rounded-xl bg-primary/10 px-4 py-3 text-sm font-semibold text-primary"
          >
            {session.partner.shelter_name} · 매칭 리스트
          </Link>
        </li>
      )}
      <li>
        <button
          type="button"
          onClick={() => void logout()}
          className="block w-full rounded-xl px-4 py-3 text-left text-sm font-semibold text-muted hover:bg-gray-50"
        >
          로그아웃
        </button>
      </li>
    </>
  );
}
