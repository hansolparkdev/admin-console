import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { adminUserKeys } from "@/features/admin-users/queries";
import { fetchAdminUserServer } from "@/features/admin-users/api-server";
import { AdminUserDetailClient } from "@/features/admin-users/components/AdminUserDetailClient";

interface AdminUserDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminUserDetailPage({
  params,
}: AdminUserDetailPageProps) {
  const { id } = await params;
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: adminUserKeys.detail(id),
    queryFn: () => fetchAdminUserServer(id),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AdminUserDetailClient id={id} />
    </HydrationBoundary>
  );
}
