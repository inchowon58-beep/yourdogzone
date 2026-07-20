"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    arr[i] = raw.charCodeAt(i);
  }
  return arr;
}

type PushState = "unsupported" | "loading" | "off" | "on" | "denied" | "unconfigured";

export function CarePushSubscribeButton() {
  const [state, setState] = useState<PushState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const refresh = useCallback(async () => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      setState("unsupported");
      return;
    }

    try {
      const keyRes = await fetch("/api/care-matching/push/vapid-public-key");
      const keyData = await keyRes.json();
      if (!keyRes.ok || !keyData.configured || !keyData.publicKey) {
        setState("unconfigured");
        return;
      }

      if (Notification.permission === "denied") {
        setState("denied");
        return;
      }

      const reg = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });
      await navigator.serviceWorker.ready;

      const sub = await reg.pushManager.getSubscription();
      setState(sub ? "on" : "off");
    } catch {
      setState("off");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function subscribe() {
    setError(null);
    setWorking(true);
    try {
      const keyRes = await fetch("/api/care-matching/push/vapid-public-key");
      const keyData = await keyRes.json();
      if (!keyRes.ok || !keyData.publicKey) {
        setError("푸시 알림 설정이 완료되지 않았습니다.");
        setState("unconfigured");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState("denied");
        setError("알림 권한이 필요합니다. 브라우저 설정에서 허용해 주세요.");
        return;
      }

      const reg = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });
      await navigator.serviceWorker.ready;

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            keyData.publicKey
          ) as BufferSource,
        });
      }

      const json = sub.toJSON();
      const res = await fetch("/api/care-matching/partner/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "구독 등록 실패");
        return;
      }
      setState("on");
    } catch (e) {
      setError(e instanceof Error ? e.message : "알림 설정 실패");
    } finally {
      setWorking(false);
    }
  }

  async function unsubscribe() {
    setError(null);
    setWorking(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        await fetch("/api/care-matching/partner/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        });
      }
      setState("off");
    } catch (e) {
      setError(e instanceof Error ? e.message : "구독 해제 실패");
    } finally {
      setWorking(false);
    }
  }

  if (state === "loading") {
    return (
      <p className="flex items-center gap-2 text-xs text-muted">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        알림 상태 확인 중…
      </p>
    );
  }

  if (state === "unsupported") {
    return (
      <p className="text-xs text-muted">
        이 브라우저는 푸시 알림을 지원하지 않습니다.
      </p>
    );
  }

  if (state === "unconfigured") {
    return (
      <p className="text-xs text-muted">
        서버 푸시 설정이 아직 완료되지 않았습니다. (VAPID 키 필요)
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-primary/15 bg-primary/5 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">
            푸시 알림
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {state === "on"
              ? "새 매칭이 시작되면 휴대폰 알림으로 받습니다."
              : state === "denied"
                ? "브라우저에서 알림이 차단되어 있습니다."
                : "알림을 켜면 심사승인된 매칭을 바로 확인할 수 있습니다."}
          </p>
        </div>
        {state === "on" ? (
          <button
            type="button"
            disabled={working}
            onClick={() => void unsubscribe()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold disabled:opacity-60"
          >
            <BellOff className="h-3.5 w-3.5" aria-hidden />
            끄기
          </button>
        ) : (
          <button
            type="button"
            disabled={working || state === "denied"}
            onClick={() => void subscribe()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
          >
            {working ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <Bell className="h-3.5 w-3.5" aria-hidden />
            )}
            알림 켜기
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
