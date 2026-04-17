import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { auth } from "@/lib/auth";
import { getQueryClient } from "@/lib/get-query-client";
import { authKeys } from "@/features/auth/queries";
import { apiServerFetch } from "@/lib/api-server";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import type { MeResponse } from "@/features/auth/types";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    // Next.js는 서버 컴포넌트에서 x-invoke-path 또는 x-url 헤더로 현재 경로를 제공한다.
    // 없으면 /dashboard로 폴백한다.
    const headersList = await headers();
    const xUrl = headersList.get("x-url") ?? headersList.get("referer") ?? "";
    let pathname = "/dashboard";
    if (xUrl) {
      try {
        pathname = new URL(xUrl).pathname;
      } catch {
        pathname = "/dashboard";
      }
    }
    redirect(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
  }

  // session-guard: active 상태가 아닌 사용자(pending/rejected)는 /login으로 리디렉션
  const userStatus = (session.user as { status?: string } | undefined)?.status;
  if (userStatus && userStatus !== "active") {
    redirect("/login");
  }

  // /auth/me 데이터 서버 prefetch → HydrationBoundary (forbidden-patterns.md §2.3 준수)
  // apiServerFetch가 undefined를 반환할 수 있으므로 null fallback 처리
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: authKeys.me(),
    queryFn: async () => {
      const data = await apiServerFetch<MeResponse>("/auth/me");
      return data ?? null;
    },
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Sidebar />
      <Header user={session.user} />
      <div style={{ marginLeft: "var(--sidebar-width)" }}>
        <main
          style={{
            marginTop: "var(--header-height)",
            width: "calc(100vw - var(--sidebar-width))",
            padding: "40px",
            backgroundColor: "var(--background)",
            minHeight: "calc(100vh - var(--header-height))",
            overflowX: "hidden",
          }}
        >
          {children}
        </main>
        <footer
          role="contentinfo"
          className="p-8 text-center"
          style={{ color: "var(--footer-muted-foreground)" }}
        >
          {`© ${new Date().getFullYear()} ADMIN CONSOLE. All rights reserved.`}
        </footer>
      </div>
    </HydrationBoundary>
  );
}
