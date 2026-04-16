// TODO(google-oidc-login): auth() 가드 hook
//   const session = await auth();
//   if (!session) redirect(`/login?callbackUrl=${encodeURIComponent(...)}`);

import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      <Header />
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
