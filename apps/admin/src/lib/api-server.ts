import "server-only";
import { auth } from "@/lib/auth";

// Server-side fetcher. Used in Server Components / Route Handlers /
// Server Actions to reach the internal API directly (no BFF hop).
//
// The API_URL is server-only — never imported into a client bundle.
// auth() 세션의 사용자 정보를 내부 헤더로 전달 (BFF 패턴).

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

  // 세션 JWT에서 Google ID Token을 Bearer로 전달 (BFF 패턴)
  // email은 ID Token payload에 포함되어 있어 별도 헤더 불필요.
  const sessionHeaders: Record<string, string> = {};
  const session = (await auth()) as { idToken?: string } | null;
  if (session?.idToken) {
    sessionHeaders["authorization"] = `Bearer ${session.idToken}`;
  }

  const res = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...sessionHeaders,
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
