"use client";

import { useState } from "react";
import { useAdminUsers } from "../queries";
import { AdminUserTable } from "./AdminUserTable";
import type { AdminUserStatus } from "../types";

const LIMIT = 10;

const tabs: { label: string; value: AdminUserStatus | undefined }[] = [
  { label: "전체", value: undefined },
  { label: "승인 대기", value: "pending" },
  { label: "활성", value: "active" },
  { label: "거절됨", value: "rejected" },
];

export function AdminUsersListClient() {
  const [activeTab, setActiveTab] = useState<AdminUserStatus | undefined>(
    undefined,
  );
  const [page, setPage] = useState(1);
  const { data, isPending, isError } = useAdminUsers(activeTab, page);

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  function handleTabChange(tab: AdminUserStatus | undefined) {
    setActiveTab(tab);
    setPage(1);
  }

  return (
    <div>
      {/* 페이지 헤더 */}
      <div className="mb-10">
        <h2 className="text-3xl font-extrabold text-on-surface font-headline tracking-tight mb-2">
          관리자 관리
        </h2>
        <p className="text-on-surface-variant text-base">
          관리자 계정을 승인·거절·복구할 수 있습니다.
        </p>
      </div>

      {/* 탭 pill */}
      <div
        role="tablist"
        className="flex items-center gap-2 mb-8 p-1 bg-surface-container-low rounded-full w-fit"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.label}
              role="tab"
              aria-selected={isActive}
              onClick={() => handleTabChange(tab.value)}
              className={
                isActive
                  ? "px-6 py-2 rounded-full text-sm font-bold bg-primary text-white shadow-md transition-all"
                  : "px-6 py-2 rounded-full text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-all"
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <AdminUserTable
        users={data?.data}
        isPending={isPending}
        isError={isError}
      />

      {/* 페이지네이션 */}
      {!isPending && !isError && total > 0 && (
        <div className="mt-4 px-8 py-6 bg-surface-container-low rounded-xl flex items-center justify-between">
          <p className="text-xs text-on-surface-variant font-medium">
            {`총 ${total}명 중 ${(page - 1) * LIMIT + 1}–${Math.min(page * LIMIT, total)}명 표시`}
          </p>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 rounded bg-surface-container-lowest text-on-surface flex items-center justify-center disabled:opacity-40 text-sm font-bold"
              aria-label="이전 페이지"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={
                  p === page
                    ? "w-8 h-8 rounded bg-primary text-white flex items-center justify-center font-bold text-xs shadow-sm"
                    : "w-8 h-8 rounded bg-surface-container-lowest text-on-surface flex items-center justify-center text-xs hover:bg-surface-container"
                }
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 rounded bg-surface-container-lowest text-on-surface flex items-center justify-center disabled:opacity-40 text-sm font-bold"
              aria-label="다음 페이지"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
