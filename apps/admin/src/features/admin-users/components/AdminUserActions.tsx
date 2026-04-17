"use client";

import {
  useApproveAdminUser,
  useRejectAdminUser,
  useRestoreAdminUser,
} from "../queries";
import type { AdminUser } from "../types";

interface AdminUserActionsProps {
  user: AdminUser;
}

/**
 * 관리자 상태에 따른 액션 버튼 컴포넌트.
 * - pending → 승인 / 거절
 * - active  → 거절
 * - rejected → 대기로 복구 / 승인으로 복구
 *
 * 낙관적 업데이트: queryClient.setQueryData 사용 (setState+await 금지 - forbidden-patterns.md §2.2).
 */
export function AdminUserActions({ user }: AdminUserActionsProps) {
  const approveMutation = useApproveAdminUser();
  const rejectMutation = useRejectAdminUser();
  const restoreMutation = useRestoreAdminUser();

  const isPending =
    approveMutation.isPending ||
    rejectMutation.isPending ||
    restoreMutation.isPending;

  const baseClass =
    "px-4 py-1.5 text-xs font-bold rounded-lg hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed";

  return (
    <div className="flex gap-2 flex-wrap justify-end">
      {/* pending → 승인 + 거절 */}
      {user.status === "pending" && (
        <>
          <button
            type="button"
            disabled={isPending}
            onClick={() => approveMutation.mutate(user.id)}
            className={`${baseClass} bg-[#2e7d32] text-white`}
          >
            승인
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => rejectMutation.mutate(user.id)}
            className={`${baseClass} bg-error text-white`}
          >
            거절
          </button>
        </>
      )}

      {/* active → 거절 */}
      {user.status === "active" && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => rejectMutation.mutate(user.id)}
          className={`${baseClass} border border-error text-error hover:bg-error/5`}
        >
          거절
        </button>
      )}

      {/* rejected → 대기로 복구 / 승인으로 복구 */}
      {user.status === "rejected" && (
        <>
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              restoreMutation.mutate({ id: user.id, targetStatus: "pending" })
            }
            className={`${baseClass} border border-on-surface-variant text-on-surface-variant hover:bg-surface`}
          >
            대기로 복구
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              restoreMutation.mutate({ id: user.id, targetStatus: "active" })
            }
            className={`${baseClass} bg-[#2e7d32] text-white`}
          >
            승인으로 복구
          </button>
        </>
      )}
    </div>
  );
}
