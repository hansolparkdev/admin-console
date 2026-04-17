"use client";

import Link from "next/link";
import { AdminUserStatusBadge } from "./AdminUserStatusBadge";
import { AdminUserActions } from "./AdminUserActions";
import type { AdminUser } from "../types";

interface AdminUserTableProps {
  users: AdminUser[] | undefined;
  isPending: boolean;
  isError: boolean;
}

export function AdminUserTable({
  users,
  isPending,
  isError,
}: AdminUserTableProps) {
  if (isPending)
    return (
      <div className="text-center py-10 text-on-surface-variant">
        로딩 중...
      </div>
    );
  if (isError)
    return (
      <div role="alert" className="text-center py-10 text-error">
        목록을 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
      </div>
    );
  if (!users || users.length === 0)
    return (
      <div className="text-center py-10 text-on-surface-variant">
        해당 조건의 관리자가 없습니다.
      </div>
    );

  return (
    <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-low">
              <th className="px-8 py-5 text-[0.75rem] font-bold text-on-surface-variant uppercase tracking-[0.05em] font-label">
                사용자 이름
              </th>
              <th className="px-8 py-5 text-[0.75rem] font-bold text-on-surface-variant uppercase tracking-[0.05em] font-label">
                이메일 주소
              </th>
              <th className="px-8 py-5 text-[0.75rem] font-bold text-on-surface-variant uppercase tracking-[0.05em] font-label">
                역할
              </th>
              <th className="px-8 py-5 text-[0.75rem] font-bold text-on-surface-variant uppercase tracking-[0.05em] font-label">
                상태
              </th>
              <th className="px-8 py-5 text-[0.75rem] font-bold text-on-surface-variant uppercase tracking-[0.05em] font-label text-right">
                액션
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr
                key={user.id}
                className={
                  index % 2 === 0
                    ? "bg-surface-container-low"
                    : "bg-surface-container-lowest"
                }
              >
                <td className="px-8 py-5">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="text-primary font-bold hover:underline"
                  >
                    {user.name ?? "-"}
                  </Link>
                </td>
                <td className="px-8 py-5 text-on-surface-variant">
                  {user.email}
                </td>
                <td className="px-8 py-5">
                  <span className="text-xs font-semibold px-2 py-1 bg-surface-container rounded text-on-surface-variant">
                    관리자
                  </span>
                </td>
                <td className="px-8 py-5">
                  <AdminUserStatusBadge status={user.status} />
                </td>
                <td className="px-8 py-5 text-right">
                  <AdminUserActions user={user} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
