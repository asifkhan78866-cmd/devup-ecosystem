import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

// The project's tsconfig does not include the WebWorker lib, so the push and
// notification shapes are declared locally rather than widening lib globally.
type SwClient = { focus(): Promise<SwClient>; navigate(url: string): Promise<unknown> };

interface SwScope extends WorkerGlobalScope {
  registration: { showNotification(title: string, options?: Record<string, unknown>): Promise<void> };
  clients: {
    matchAll(opts?: { type?: string; includeUncontrolled?: boolean }): Promise<SwClient[]>;
    openWindow(url: string): Promise<SwClient | null>;
  };
  addEventListener(type: "push", listener: (e: SwPushEvent) => void): void;
  addEventListener(type: "notificationclick", listener: (e: SwNotificationEvent) => void): void;
}

interface SwPushEvent {
  data: { json(): unknown; text(): string } | null;
  waitUntil(p: Promise<unknown>): void;
}

interface SwNotificationEvent {
  notification: { close(): void; data?: Record<string, unknown> };
  waitUntil(p: Promise<unknown>): void;
}

declare const self: SwScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

/* ── Web Push (VAPID) ──────────────────────────────
   The backend sends a JSON body of { title, body, url, tag }. Handled here
   rather than in a separate firebase-messaging-sw.js so there is only ever
   one service worker controlling the page. */

self.addEventListener("push", (event: SwPushEvent) => {
  if (!event.data) return;

  let payload: { title?: string; body?: string; url?: string; tag?: string } = {};
  try {
    payload = event.data.json() as typeof payload;
  } catch {
    payload = { title: "DevUp Ecosystem", body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title ?? "DevUp Ecosystem", {
      body: payload.body ?? "",
      icon: "/icon.png",
      badge: "/icon.png",
      // Same tag collapses repeat updates for one event instead of stacking.
      tag: payload.tag ?? "devup",
      data: { url: payload.url ?? "/dashboard" },
    })
  );
});

self.addEventListener("notificationclick", (event: SwNotificationEvent) => {
  event.notification.close();
  const target = (event.notification.data?.url as string) ?? "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients: SwClient[]) => {
      // Reuse an open tab when there is one; only open a new one otherwise.
      const client = clients[0];
      if (client) {
        client.navigate(target);
        return client.focus();
      }
      return self.clients.openWindow(target);
    })
  );
});
