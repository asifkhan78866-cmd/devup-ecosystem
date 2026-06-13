const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  meta?: Record<string, unknown>;
  error?: string;
  code?: string;
  message?: string;
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

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("devup_token") : null;

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
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    throw new ApiError(
      response.status,
      payload.code || "UNKNOWN_ERROR",
      payload.error || payload.message || response.statusText
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
  delete: <T>(path: string) =>
    request<T>(path, {
      method: "DELETE",
    }),
};

export const apiClient = request;
export { ApiError };
export default api;
