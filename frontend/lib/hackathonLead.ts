/**
 * A hackathon team's private access token.
 *
 * Registration returns it and the team's inbox receives it in a "manage your
 * registration" link (as `#lead=<token>`, a URL fragment browsers never send to
 * a server). It is kept per hackathon in this browser and sent as the
 * X-Lead-Token header — never in a URL — to the team's own endpoints.
 */
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const key = (hackathonId: string) => `devup-lead:${hackathonId}`;

export function storeLeadToken(hackathonId: string, token: string) {
  try {
    localStorage.setItem(key(hackathonId), token);
  } catch {
    /* storage blocked: the emailed link still works */
  }
}

export function getLeadToken(hackathonId: string): string | null {
  try {
    return localStorage.getItem(key(hackathonId));
  } catch {
    return null;
  }
}

export function clearLeadToken(hackathonId: string) {
  try {
    localStorage.removeItem(key(hackathonId));
  } catch {
    /* nothing to clear */
  }
}

/**
 * Takes a token from an emailed link (`#lead=…`), keeps it, and removes it
 * from the address bar so it does not linger in history or screenshots.
 * Returns true when a token was found.
 */
export function captureLeadTokenFromUrl(hackathonId: string): boolean {
  if (typeof window === "undefined") return false;
  const token = new URLSearchParams(window.location.hash.slice(1)).get("lead");
  if (!token) return false;
  storeLeadToken(hackathonId, token);
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  return true;
}

/** Calls the team's own endpoints: /api/hackathons/:id/leads/me{path}. */
export async function leadFetch(hackathonId: string, path = "", init: RequestInit = {}) {
  const token = getLeadToken(hackathonId);
  const headers = new Headers(init.headers);
  if (token) headers.set("X-Lead-Token", token);
  const res = await fetch(`${API}/api/hackathons/${hackathonId}/leads/me${path}`, { ...init, headers });
  // A rejected token is useless from here on; forget it so the page offers a new link.
  if (res.status === 401) clearLeadToken(hackathonId);
  return res;
}

/** "Email me my link." Same response whether or not the phone is registered. */
export async function requestLeadAccessLink(hackathonId: string, phone: string) {
  return fetch(`${API}/api/hackathons/${hackathonId}/leads/access-link`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
}
