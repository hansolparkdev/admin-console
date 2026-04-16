import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

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

  return (
    <>
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
    </>
  );
}
