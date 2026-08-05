const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  meta?: Record<string, unknown>;
  error?: string;
  code?: string;
  message?: string;
  /** Field-level detail from the zod validate() middleware. */
  errors?: Array<{ path?: string; message?: string }>;
};

class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * The app authenticates through Supabase, so the bearer token is the Supabase
 * session access token — not a `devup_token` in localStorage. Nothing in the
 * codebase ever wrote that key, so reading it sent requests with no auth header
 * at all and every call came back "Invalid token".
 *
 * localStorage is kept only as a fallback for the dev-bypass JWT.
 */
async function getAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  try {
    const { createClient } = await import("@/lib/supabase");
    const { data } = await createClient().auth.getSession();
    if (data.session?.access_token) return data.session.access_token;
  } catch {
    // Supabase unavailable — fall through to the local token.
  }

  return localStorage.getItem("devup_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (error) {
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      error instanceof Error ? error.message : "Network request failed"
    );
  }

  const isJson = response.headers
    .get("content-type")
    ?.includes("application/json");
  const payload = (isJson ? await response.json() : {}) as ApiResponse<T>;

  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("devup_token");

      // Only bounce to login when the user genuinely has no session. If a
      // Supabase session exists, a 401 means the backend rejected an otherwise
      // valid token — redirecting would loop, so surface the error instead.
      const stillSignedIn = await getAccessToken();
      if (!stillSignedIn && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    // A bare "Validation Error" tells the user nothing — surface the fields
    // that actually failed so the message is actionable.
    const fieldErrors = payload.errors
      ?.map((e) => {
        const field = (e.path ?? "").replace(/^body[.]/, "");
        return field ? field + ": " + e.message : e.message;
      })
      .filter(Boolean)
      .join(" · ");

    throw new ApiError(
      response.status,
      payload.code || "UNKNOWN_ERROR",
      fieldErrors || payload.error || payload.message || response.statusText
    );
  }

  if (payload.meta && typeof payload.data !== "undefined") {
    return { data: payload.data, ...payload.meta } as T;
  }

  return (payload.data ?? payload) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  delete: <T>(path: string) =>
    request<T>(path, {
      method: "DELETE",
    }),
};

export const apiClient = request;
export { ApiError };
export default api;
