"use client";

import { useState } from "react";
import {
  useAdminUser,
  useApproveAdminUser,
  useRejectAdminUser,
  useRestoreAdminUser,
} from "../queries";
import { UserRoleList } from "./UserRoleList";
import { UserRoleAssignDialog } from "./UserRoleAssignDialog";

interface AdminUserDetailClientProps {
  id: string;
}

const statusDotClass: Record<string, string> = {
  pending: "bg-amber-500",
  active: "bg-green-500",
  rejected: "bg-red-500",
};

const statusLabel: Record<string, string> = {
  pending: "승인 대기 중",
  active: "활성",
  rejected: "거절됨",
};

const statusBadgeLabel: Record<string, string> = {
  pending: "PENDING",
  active: "ACTIVE",
  rejected: "REJECTED",
};

export function AdminUserDetailClient({ id }: AdminUserDetailClientProps) {
  const { data: user, isPending, isError } = useAdminUser(id);
  const approveMutation = useApproveAdminUser();
  const rejectMutation = useRejectAdminUser();
  const restoreMutation = useRestoreAdminUser();
  const [assignRoleOpen, setAssignRoleOpen] = useState(false);

  const isMutating =
    approveMutation.isPending ||
    rejectMutation.isPending ||
    restoreMutation.isPending;

  if (isPending)
    return (
      <div className="text-center py-10 text-on-surface-variant">
        로딩 중...
      </div>
    );
  if (isError || !user)
    return (
      <div role="alert" className="text-center py-10 text-error">
        관리자 정보를 불러오는 중 오류가 발생했습니다.
      </div>
    );

  const dotClass = statusDotClass[user.status] ?? "bg-gray-400";

  return (
    <div>
      {/* 페이지 헤더 */}
      <div className="mb-10">
        <h2 className="text-3xl font-extrabold tracking-tight text-on-surface font-headline">
          관리자 상세
        </h2>
        <p className="text-on-surface-variant mt-2">
          사용자 계정 권한 및 가입 승인 현황을 관리합니다.
        </p>
      </div>

      {/* 12컬럼 그리드 */}
      <div className="grid grid-cols-12 gap-8">
        {/* 유저 정보 카드 (7컬럼) */}
        <div
          className="col-span-12 lg:col-span-7 bg-surface-container-lowest rounded-3xl p-8 flex flex-col"
          style={{ boxShadow: "0px 12px 32px rgba(42,52,57,0.06)" }}
        >
          {/* 아바타 + 이름/이메일/뱃지 */}
          <div className="flex items-start gap-6 mb-10">
            <div className="relative flex-shrink-0">
              {user.picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.picture}
                  alt={user.name ?? user.email}
                  className="w-16 h-16 rounded-full object-cover"
                  style={{ boxShadow: "0px 12px 32px rgba(42,52,57,0.06)" }}
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-2xl font-bold text-on-surface-variant">
                  {(user.name ?? user.email).charAt(0).toUpperCase()}
                </div>
              )}
              {/* 상태 도트 */}
              <span
                className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white ${dotClass}`}
              />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-[20px] font-bold text-on-surface font-headline">
                {user.name ?? "-"}
              </h3>
              <p className="text-sm font-medium text-on-surface-variant">
                {user.email}
              </p>
            </div>

            {/* 상태 뱃지 pill */}
            <div className="px-4 py-1.5 bg-secondary-container text-on-secondary-container rounded-full text-xs font-bold tracking-tight uppercase flex-shrink-0">
              {statusBadgeLabel[user.status]}
            </div>
          </div>

          {/* 정보 행 */}
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-6 border-b border-surface-container">
              <span className="text-xs font-bold text-on-surface-variant tracking-wider uppercase">
                상태
              </span>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${dotClass}`} />
                <span className="text-sm font-semibold text-on-surface">
                  {statusLabel[user.status]}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between pb-6 border-b border-surface-container">
              <span className="text-xs font-bold text-on-surface-variant tracking-wider uppercase">
                역할
              </span>
              <span className="text-sm font-semibold text-on-surface">
                (동적 역할 관리)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface-variant tracking-wider uppercase">
                등록일
              </span>
              <span className="text-sm font-semibold text-on-surface">
                {new Date(user.createdAt).toLocaleDateString("ko-KR")}
              </span>
            </div>
          </div>
        </div>

        {/* 액션 카드 (5컬럼) */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-8">
          <div
            className="bg-surface-container-lowest rounded-3xl p-8"
            style={{ boxShadow: "0px 12px 32px rgba(42,52,57,0.06)" }}
          >
            <h3 className="text-lg font-bold text-on-surface font-headline mb-8">
              관리 액션
            </h3>

            <div className="space-y-8">
              {/* pending */}
              {user.status === "pending" && (
                <>
                  <div>
                    <button
                      type="button"
                      disabled={isMutating}
                      onClick={() => approveMutation.mutate(user.id)}
                      className="w-full py-4 bg-gradient-to-br from-[#22c55e] to-[#16a34a] text-white font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      승인
                    </button>
                    <p className="mt-3 text-xs text-on-surface-variant leading-normal text-center">
                      사용자에게 관리자 권한을 즉시 부여합니다.
                    </p>
                  </div>

                  {/* or 구분선 */}
                  <div className="relative py-2 flex items-center">
                    <div className="flex-grow border-t border-surface-container" />
                    <span className="flex-shrink mx-4 text-[10px] font-bold text-outline-variant uppercase tracking-widest">
                      or
                    </span>
                    <div className="flex-grow border-t border-surface-container" />
                  </div>

                  <div>
                    <button
                      type="button"
                      disabled={isMutating}
                      onClick={() => rejectMutation.mutate(user.id)}
                      className="w-full py-4 border-2 border-error text-error font-bold rounded-xl hover:bg-error/5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      거절
                    </button>
                    <p className="mt-3 text-xs text-on-surface-variant leading-normal text-center">
                      권한 요청을 거부하며, 해당 계정은 비활성화 상태로
                      전환됩니다.
                    </p>
                  </div>
                </>
              )}

              {/* active */}
              {user.status === "active" && (
                <button
                  type="button"
                  disabled={isMutating}
                  onClick={() => rejectMutation.mutate(user.id)}
                  className="w-full py-4 border-2 border-error text-error font-bold rounded-xl hover:bg-error/5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  거절
                </button>
              )}

              {/* rejected */}
              {user.status === "rejected" && (
                <>
                  <button
                    type="button"
                    disabled={isMutating}
                    onClick={() =>
                      restoreMutation.mutate({
                        id: user.id,
                        targetStatus: "pending",
                      })
                    }
                    className="w-full py-4 border-2 border-on-surface-variant text-on-surface-variant font-bold rounded-xl hover:bg-surface transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    대기로 복구
                  </button>
                  <button
                    type="button"
                    disabled={isMutating}
                    onClick={() =>
                      restoreMutation.mutate({
                        id: user.id,
                        targetStatus: "active",
                      })
                    }
                    className="w-full py-4 bg-gradient-to-br from-[#22c55e] to-[#16a34a] text-white font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    승인으로 복구
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 보안 지침 카드 */}
          <div
            className="bg-primary-dim rounded-3xl p-8 text-white relative overflow-hidden"
            style={{ boxShadow: "0px 12px 32px rgba(42,52,57,0.06)" }}
          >
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            <h4 className="text-sm font-bold mb-2 relative z-10 font-headline">
              보안 지침
            </h4>
            <p className="text-xs text-blue-100/80 leading-relaxed relative z-10">
              모든 관리자 승인 로그는 내부 보안 정책에 따라 보관됩니다.
              비정상적인 접근이 의심될 경우 즉시 보안 팀에 보고하십시오.
            </p>
          </div>
        </div>
      </div>

      {/* 역할 관리 섹션 */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-on-surface font-headline">
            역할 관리
          </h3>
          <button
            type="button"
            onClick={() => setAssignRoleOpen(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold cursor-pointer"
          >
            역할 할당
          </button>
        </div>
        <UserRoleList userId={id} />
      </div>

      <UserRoleAssignDialog
        open={assignRoleOpen}
        onClose={() => setAssignRoleOpen(false)}
        userId={id}
      />
    </div>
  );
}
