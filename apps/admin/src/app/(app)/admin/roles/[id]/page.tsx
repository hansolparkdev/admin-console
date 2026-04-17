import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { apiServerFetch } from "@/lib/api-server";
import { roleKeys } from "@/lib/query-keys/role-keys";
import { RoleDetailClient } from "@/features/roles/components/RoleDetailClient";
import type { Role } from "@/features/roles/types";

interface RoleDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * /admin/roles/[id] 페이지 — SUPER_ADMIN 전용.
 * Server prefetch + HydrationBoundary (forbidden-patterns.md §2.3 준수).
 */
export default async function RoleDetailPage({ params }: RoleDetailPageProps) {
  const { id } = await params;
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: roleKeys.detail(id),
    queryFn: async () => {
      const data = await apiServerFetch<Role>(`/roles/${id}`);
      return data ?? null;
    },
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RoleDetailClient id={id} />
    </HydrationBoundary>
  );
}
