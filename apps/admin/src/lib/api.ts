// Client-side fetcher. Browsers hit /api/* (same-origin) which the BFF
// route handler proxies to the internal API. Cookies travel via
// credentials: "include" so Auth.js session reaches this Next.js origin.
//
// CLAUDE.md forbids NEXT_PUBLIC_API_URL — the backend host must not leak
// into the browser bundle. Callers always use the relative /api prefix.

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body: unknown,
  ) {
    super(`API ${status} ${statusText}`);
    this.name = "ApiError";
  }
}

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

interface RequestOptions {
  method?: HttpMethod;
  body?: JsonValue;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

const BASE_PATH = "/api";

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const url = path.startsWith("/")
    ? `${BASE_PATH}${path}`
    : `${BASE_PATH}/${path}`;

  const res = await fetch(url, {
    method: options.method ?? "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    body: options.body != null ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  if (!res.ok) {
    const errorBody: unknown = await safeJson(res);
    throw new ApiError(res.status, res.statusText, errorBody);
  }

  // 204 No Content and HEAD responses have no body.
  if (res.status === 204 || options.method === undefined) {
    const text = await res.text();
    if (text.length === 0) return undefined as T;
    return JSON.parse(text) as T;
  }

  return (await res.json()) as T;
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return await res.text();
  }
}
