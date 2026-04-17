import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { apiServerFetch } from "@/lib/api-server";
import { roleKeys } from "@/lib/query-keys/role-keys";
import { RolesPageClient } from "@/features/roles/components/RolesPageClient";
import type { Role } from "@/features/roles/types";

/**
 * /admin/roles 페이지 — SUPER_ADMIN 전용.
 * Server prefetch + HydrationBoundary (forbidden-patterns.md §2.3 준수).
 */
export default async function RolesPage() {
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: roleKeys.lists(),
    queryFn: async () => {
      const data = await apiServerFetch<Role[]>("/roles");
      return data ?? [];
    },
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RolesPageClient />
    </HydrationBoundary>
  );
}
