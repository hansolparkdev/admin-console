import "server-only";
import type { NextRequest } from "next/server";

// BFF proxy. Browser calls /api/... and this handler forwards to the
// internal API. Keeping API_URL server-only means the backend host is
// never exposed in bundles (`NEXT_PUBLIC_` is forbidden — CLAUDE.md).
//
// Step 9 will add `auth()` here to pull the session and attach a Bearer
// token. For now this is a pure pass-through so admin↔api wiring can be
// exercised before auth lands.

const API_URL = process.env.API_URL ?? "http://localhost:3001";

// Next.js strips `/api` when it hits this catch-all route, so
// `/api/health` arrives as params.proxy = ["health"]. Reconstruct the
// upstream path from that + the incoming search string.
async function proxy(
  req: NextRequest,
  ctx: { params: Promise<{ proxy: string[] }> },
): Promise<Response> {
  const { proxy: segments } = await ctx.params;
  const path = segments.map(encodeURIComponent).join("/");
  const url = new URL(req.url);
  const target = `${API_URL}/${path}${url.search}`;

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");

  const method = req.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";

  const upstream = await fetch(target, {
    method,
    headers,
    body: hasBody ? await req.arrayBuffer() : undefined,
    redirect: "manual",
    cache: "no-store",
  });

  // Pass response through unchanged. We don't rewrite Set-Cookie because
  // Auth.js (Step 9) owns browser session cookies; upstream cookies go
  // back as-is and the browser only trusts our own domain.
  const resHeaders = new Headers(upstream.headers);
  resHeaders.delete("content-length");
  resHeaders.delete("content-encoding");

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: resHeaders,
  });
}

export {
  proxy as GET,
  proxy as POST,
  proxy as PUT,
  proxy as PATCH,
  proxy as DELETE,
  proxy as OPTIONS,
  proxy as HEAD,
};
