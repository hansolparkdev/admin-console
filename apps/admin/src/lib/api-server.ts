import "server-only";

// Server-side fetcher. Used in Server Components / Route Handlers /
// Server Actions to reach the internal API directly (no BFF hop).
//
// The API_URL is server-only — never imported into a client bundle.
// When auth (Step 9) lands, this helper will also attach the session's
// access token as a Bearer header.

const API_URL = process.env.API_URL ?? "http://localhost:3001";

export class ApiServerError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body: unknown,
  ) {
    super(`API ${status} ${statusText}`);
    this.name = "ApiServerError";
  }
}

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

interface ServerRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: JsonValue;
  headers?: Record<string, string>;
  // Next.js fetch extensions
  cache?: RequestCache;
  next?: { revalidate?: number | false; tags?: string[] };
}

export async function apiServerFetch<T = unknown>(
  path: string,
  options: ServerRequestOptions = {},
): Promise<T> {
  const url = path.startsWith("/") ? `${API_URL}${path}` : `${API_URL}/${path}`;

  const res = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    body: options.body != null ? JSON.stringify(options.body) : undefined,
    cache: options.cache ?? "no-store",
    next: options.next,
  });

  if (!res.ok) {
    const errorBody: unknown = await safeJson(res);
    throw new ApiServerError(res.status, res.statusText, errorBody);
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  if (text.length === 0) return undefined as T;
  return JSON.parse(text) as T;
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return await res.text();
  }
}
