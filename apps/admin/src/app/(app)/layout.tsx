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
      <main
        style={{
          marginLeft: "var(--sidebar-width)",
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
    </>
  );
}
