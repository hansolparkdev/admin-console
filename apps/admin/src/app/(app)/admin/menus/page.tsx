import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { apiServerFetch } from "@/lib/api-server";
import { menuKeys } from "@/lib/query-keys/menu-keys";
import { MenusPageClient } from "@/features/menus/components/MenusPageClient";
import type { MenuNode } from "@/features/menus/types";

/**
 * /admin/menus 페이지 — SUPER_ADMIN 전용.
 * Server prefetch + HydrationBoundary (forbidden-patterns.md §2.3 준수).
 */
export default async function MenusPage() {
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: menuKeys.lists(),
    queryFn: async () => {
      const data = await apiServerFetch<MenuNode[]>("/menus");
      return data ?? [];
    },
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MenusPageClient />
    </HydrationBoundary>
  );
}
