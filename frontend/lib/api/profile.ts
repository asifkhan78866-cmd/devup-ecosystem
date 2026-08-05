import { api, apiClient } from "./client";

export interface StudentProfile {
  name?: string;
  email?: string;
  bio?: string;
  phone?: string;
  college?: string;
  degree?: string;
  branch?: string;
  graduationYear?: number;
  cgpa?: string | number;
  experienceYears?: string | number;
  city?: string;
  skills?: string[];
  githubUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  portfolioUrl?: string;
  resumeUrl?: string;
  resumeFileName?: string;
  resumeUpdatedAt?: string;
  isOpenToWork?: boolean;
  isLookingForCofounder?: boolean;
  completeness?: number;
  missing?: string[];
  suggestions?: string[];
  minToApply?: number;
  canApply?: {
    eligible: boolean;
    completeness: number;
    missing: string[];
    reason?: string;
  };
}

export const profileApi = {
  get: () => api.get<StudentProfile>("/api/profile"),
  save: (body: Partial<StudentProfile>) => api.put<StudentProfile>("/api/profile", body),

  uploadResume: (file: File) => {
    const fd = new FormData();
    fd.append("resume", file);
    return apiClient<StudentProfile>("/api/profile/resume", { method: "POST", body: fd });
  },

  notifications: () => api.get<{ items: any[]; unread: number }>("/api/profile/notifications"),
  markRead: (id?: string) => api.post("/api/profile/notifications/read", id ? { id } : {}),

  pushKey: () => api.get<{ publicKey: string | null; enabled: boolean }>("/api/profile/push/key"),
  subscribePush: (sub: PushSubscriptionJSON) => api.post("/api/profile/push/subscribe", sub),
  unsubscribePush: (endpoint: string) => api.post("/api/profile/push/unsubscribe", { endpoint }),
  testPush: () => api.post("/api/profile/push/test", {}),
};

/* ── Web Push helpers ─────────────────────────────── */

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function pushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function currentPushSubscription() {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

/**
 * Asks permission, subscribes with the server's VAPID key, and registers the
 * subscription. Returns a human-readable reason when it cannot proceed —
 * a denied permission cannot be re-prompted, so the UI must explain that.
 */
export async function enablePush(): Promise<{ ok: boolean; reason?: string }> {
  if (!pushSupported()) return { ok: false, reason: "This browser does not support push notifications." };

  const { publicKey, enabled } = await profileApi.pushKey();
  if (!enabled || !publicKey) return { ok: false, reason: "Push is not configured on the server yet." };

  const permission = await Notification.requestPermission();
  if (permission === "denied") {
    return { ok: false, reason: "Notifications are blocked. Enable them in your browser site settings." };
  }
  if (permission !== "granted") return { ok: false, reason: "Permission was dismissed." };

  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  const sub =
    existing ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }));

  await profileApi.subscribePush(sub.toJSON());
  return { ok: true };
}

export async function disablePush() {
  const sub = await currentPushSubscription();
  if (!sub) return;
  await profileApi.unsubscribePush(sub.endpoint);
  await sub.unsubscribe();
}
