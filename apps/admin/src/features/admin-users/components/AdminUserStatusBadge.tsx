import type { AdminUserStatus } from "../types";

interface AdminUserStatusBadgeProps {
  status: AdminUserStatus;
}

const statusConfig: Record<
  AdminUserStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "승인 대기",
    className: "bg-orange-100 text-orange-700",
  },
  active: {
    label: "활성",
    className: "bg-blue-100 text-blue-700",
  },
  rejected: {
    label: "거절됨",
    className: "bg-red-100 text-red-700",
  },
};

export function AdminUserStatusBadge({ status }: AdminUserStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`px-3 py-1 rounded-full text-[11px] font-bold ${config.className}`}
    >
      {config.label}
    </span>
  );
}
