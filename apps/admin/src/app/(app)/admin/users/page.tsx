import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { adminUserKeys } from "@/features/admin-users/queries";
import { fetchAdminUsersServer } from "@/features/admin-users/api-server";
import { AdminUsersListClient } from "@/features/admin-users/components/AdminUsersListClient";

/**
 * 관리자 목록 페이지 — super_admin 전용.
 *
 * Server Component에서 prefetch 후 HydrationBoundary로 클라이언트에 전달.
 * fetch-on-render 금지(forbidden-patterns.md §2.3) 준수.
 * Server Component에서 lib/api-server.ts 사용(§2.4) 준수.
 */
export default async function AdminUsersPage() {
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: adminUserKeys.list(undefined, 1),
    queryFn: () => fetchAdminUsersServer(undefined, 1),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AdminUsersListClient />
    </HydrationBoundary>
  );
}
