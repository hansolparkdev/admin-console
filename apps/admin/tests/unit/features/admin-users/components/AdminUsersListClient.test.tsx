import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// useAdminUsers mock
vi.mock("@/features/admin-users/queries", () => ({
  useAdminUsers: vi.fn(),
  useApproveAdminUser: vi.fn(),
  useRejectAdminUser: vi.fn(),
  useRestoreAdminUser: vi.fn(),
}));

import {
  useAdminUsers,
  useApproveAdminUser,
  useRejectAdminUser,
  useRestoreAdminUser,
} from "@/features/admin-users/queries";
import { AdminUsersListClient } from "@/features/admin-users/components/AdminUsersListClient";

const mockMutate = vi.fn();
const mockMutation = { mutate: mockMutate, isPending: false };

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  }
  return Wrapper;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useApproveAdminUser).mockReturnValue(
    mockMutation as ReturnType<typeof useApproveAdminUser>,
  );
  vi.mocked(useRejectAdminUser).mockReturnValue(
    mockMutation as ReturnType<typeof useRejectAdminUser>,
  );
  vi.mocked(useRestoreAdminUser).mockReturnValue(
    mockMutation as ReturnType<typeof useRestoreAdminUser>,
  );
});

describe("AdminUsersListClient", () => {
  it("로딩 중이면 로딩 표시를 렌더링한다", () => {
    vi.mocked(useAdminUsers).mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
    } as ReturnType<typeof useAdminUsers>);

    render(<AdminUsersListClient />, { wrapper: createWrapper() });
    expect(screen.getByText(/로딩/)).toBeInTheDocument();
  });

  it("에러 상태이면 에러 메시지를 렌더링한다", () => {
    vi.mocked(useAdminUsers).mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
    } as ReturnType<typeof useAdminUsers>);

    render(<AdminUsersListClient />, { wrapper: createWrapper() });
    expect(screen.getByText(/오류/)).toBeInTheDocument();
  });

  it("빈 데이터이면 빈 상태 메시지를 렌더링한다", () => {
    vi.mocked(useAdminUsers).mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
    } as ReturnType<typeof useAdminUsers>);

    render(<AdminUsersListClient />, { wrapper: createWrapper() });
    expect(screen.getByText(/없습니다/)).toBeInTheDocument();
  });

  it("탭 pill 컨테이너 — bg-surface-container-low rounded-full 클래스를 가진다", () => {
    vi.mocked(useAdminUsers).mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
    } as ReturnType<typeof useAdminUsers>);

    const { container } = render(<AdminUsersListClient />, {
      wrapper: createWrapper(),
    });
    const tabList = container.querySelector('[role="tablist"]');
    expect(tabList).toHaveClass("bg-surface-container-low");
    expect(tabList).toHaveClass("rounded-full");
  });

  it("4개 탭 버튼(전체/승인 대기/활성/거절됨)이 role='tab'으로 존재한다", () => {
    vi.mocked(useAdminUsers).mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
    } as ReturnType<typeof useAdminUsers>);

    render(<AdminUsersListClient />, { wrapper: createWrapper() });
    expect(screen.getByRole("tab", { name: "전체" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "승인 대기" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "활성" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "거절됨" })).toBeInTheDocument();
  });

  it("활성 탭 — aria-selected='true', bg-primary text-white 클래스를 가진다", () => {
    vi.mocked(useAdminUsers).mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
    } as ReturnType<typeof useAdminUsers>);

    render(<AdminUsersListClient />, { wrapper: createWrapper() });
    // 초기 activeTab=undefined → 전체 탭이 active
    const allTab = screen.getByRole("tab", { name: "전체" });
    expect(allTab).toHaveAttribute("aria-selected", "true");
    expect(allTab).toHaveClass("bg-primary");
    expect(allTab).toHaveClass("text-white");
  });

  it("비활성 탭 — aria-selected='false', text-on-surface-variant 클래스를 가진다", () => {
    vi.mocked(useAdminUsers).mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
    } as ReturnType<typeof useAdminUsers>);

    render(<AdminUsersListClient />, { wrapper: createWrapper() });
    const pendingTab = screen.getByRole("tab", { name: "승인 대기" });
    expect(pendingTab).toHaveAttribute("aria-selected", "false");
    expect(pendingTab).toHaveClass("text-on-surface-variant");
  });

  it("탭 클릭 시 useAdminUsers 호출 인자가 변경된다", async () => {
    vi.mocked(useAdminUsers).mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
    } as ReturnType<typeof useAdminUsers>);

    const user = userEvent.setup();
    render(<AdminUsersListClient />, { wrapper: createWrapper() });

    await user.click(screen.getByRole("tab", { name: "활성" }));
    // 클릭 후 useAdminUsers가 "active"로 재호출됨
    expect(vi.mocked(useAdminUsers)).toHaveBeenCalledWith(
      "active",
      expect.anything(),
    );
  });

  it("페이지 제목 '관리자 관리'를 렌더링한다", () => {
    vi.mocked(useAdminUsers).mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
    } as ReturnType<typeof useAdminUsers>);

    render(<AdminUsersListClient />, { wrapper: createWrapper() });
    const heading = screen.getByRole("heading", { name: "관리자 관리" });
    expect(heading).toBeInTheDocument();
    expect(heading).not.toHaveAttribute("style");
  });

  it("페이지 제목 — text-3xl font-extrabold text-on-surface tracking-tight 클래스를 가진다", () => {
    vi.mocked(useAdminUsers).mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
    } as ReturnType<typeof useAdminUsers>);

    render(<AdminUsersListClient />, { wrapper: createWrapper() });
    const heading = screen.getByRole("heading", { name: "관리자 관리" });
    expect(heading).toHaveClass("text-3xl");
    expect(heading).toHaveClass("font-extrabold");
    expect(heading).toHaveClass("text-on-surface");
    expect(heading).toHaveClass("tracking-tight");
  });
});
