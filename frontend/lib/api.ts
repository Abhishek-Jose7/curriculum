const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export type ApiOptions = RequestInit & { token?: string };

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  
  // Auto-resolve token from local storage if not explicitly provided
  const resolvedToken = options.token || (typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : undefined);
  if (resolvedToken) {
    headers.set("Authorization", `Bearer ${resolvedToken}`);
  }
  
  const response = await fetch(`${API_URL}${path}`, { ...options, headers, cache: "no-store" });
  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      window.localStorage.removeItem("accessToken");
      window.location.href = "/login";
    }
    throw new Error(await response.text());
  }
  
  if (response.status === 204) {
    return {} as T;
  }
  
  const text = await response.text();
  return (text ? JSON.parse(text) : {}) as T;
}

