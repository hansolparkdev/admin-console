import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn().mockReturnValue("/dashboard"),
}));

vi.mock("@/features/auth/queries", () => ({
  useMe: vi.fn(),
}));

import { SidebarNav } from "@/components/layout/SidebarNav";
import { useMe } from "@/features/auth/queries";
import type { MeResponse, MenuTreeNode } from "@/features/auth/types";

const makeMenu = (overrides: Partial<MenuTreeNode> = {}): MenuTreeNode => ({
  id: "menu-1",
  name: "대시보드",
  path: "/dashboard",
  icon: "LayoutDashboard",
  order: 0,
  permissions: { canRead: true, canWrite: false, canDelete: false },
  children: [],
  ...overrides,
});

const makeMeResponse = (menus: MenuTreeNode[]): MeResponse => ({
  id: "user-1",
  email: "admin@example.com",
  name: "Admin",
  picture: null,
  status: "active",
  roles: ["SUPER_ADMIN"],
  menus,
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  return Wrapper;
};

describe("SidebarNav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── 로딩 상태 ──────────────────────────────────────────────────────────────
  it("로딩 중 스켈레톤을 표시한다", () => {
    vi.mocked(useMe).mockReturnValue({
      isPending: true,
      isError: false,
      data: undefined,
      refetch: vi.fn(),
    } as ReturnType<typeof useMe>);

    render(<SidebarNav />, { wrapper: createWrapper() });
    expect(screen.getByTestId("sidebar-skeleton")).toBeInTheDocument();
  });

  // ─── 에러 상태 ──────────────────────────────────────────────────────────────
  it("에러 시 재시도 버튼을 표시한다", () => {
    vi.mocked(useMe).mockReturnValue({
      isPending: false,
      isError: true,
      data: undefined,
      refetch: vi.fn(),
    } as ReturnType<typeof useMe>);

    render(<SidebarNav />, { wrapper: createWrapper() });
    expect(screen.getByRole("button", { name: /재시도/ })).toBeInTheDocument();
  });

  it("재시도 버튼 클릭 시 refetch가 호출된다", async () => {
    const mockRefetch = vi.fn();
    vi.mocked(useMe).mockReturnValue({
      isPending: false,
      isError: true,
      data: undefined,
      refetch: mockRefetch,
    } as ReturnType<typeof useMe>);

    const user = userEvent.setup();
    render(<SidebarNav />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /재시도/ }));
    expect(mockRefetch).toHaveBeenCalledOnce();
  });

  // ─── 역할 미할당 상태 ────────────────────────────────────────────────────────
  it("역할 없는 관리자 — '역할이 할당되지 않았습니다' 안내", () => {
    vi.mocked(useMe).mockReturnValue({
      isPending: false,
      isError: false,
      data: makeMeResponse([]),
      refetch: vi.fn(),
    } as ReturnType<typeof useMe>);

    render(<SidebarNav />, { wrapper: createWrapper() });
    expect(screen.getByText(/역할이 할당되지 않았습니다/)).toBeInTheDocument();
  });

  // ─── 정상 메뉴 렌더링 ────────────────────────────────────────────────────────
  it("menus 응답으로 링크를 렌더링한다", () => {
    vi.mocked(useMe).mockReturnValue({
      isPending: false,
      isError: false,
      data: makeMeResponse([makeMenu()]),
      refetch: vi.fn(),
    } as ReturnType<typeof useMe>);

    render(<SidebarNav />, { wrapper: createWrapper() });
    expect(screen.getByRole("link", { name: /대시보드/ })).toBeInTheDocument();
  });

  it("비활성 메뉴가 없는 경우 메뉴 수와 링크 수가 일치한다", () => {
    const menus = [
      makeMenu({ id: "m1", name: "대시보드", path: "/dashboard" }),
      makeMenu({ id: "m2", name: "관리자 관리", path: "/admin/users" }),
    ];
    vi.mocked(useMe).mockReturnValue({
      isPending: false,
      isError: false,
      data: makeMeResponse(menus),
      refetch: vi.fn(),
    } as ReturnType<typeof useMe>);

    render(<SidebarNav />, { wrapper: createWrapper() });
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  it("현재 경로와 일치하는 메뉴에 aria-current='page'가 설정된다", () => {
    vi.mocked(useMe).mockReturnValue({
      isPending: false,
      isError: false,
      data: makeMeResponse([makeMenu()]),
      refetch: vi.fn(),
    } as ReturnType<typeof useMe>);

    render(<SidebarNav />, { wrapper: createWrapper() });
    const link = screen.getByRole("link", { name: /대시보드/ });
    expect(link).toHaveAttribute("aria-current", "page");
  });

  // ─── 그룹 메뉴 토글 ─────────────────────────────────────────────────────────
  it("path=null인 부모 메뉴는 버튼으로 렌더링된다", () => {
    const parentMenu = makeMenu({
      id: "menu-system",
      name: "시스템 관리",
      path: null,
      children: [
        makeMenu({ id: "m-users", name: "관리자 관리", path: "/admin/users" }),
      ],
    });
    vi.mocked(useMe).mockReturnValue({
      isPending: false,
      isError: false,
      data: makeMeResponse([parentMenu]),
      refetch: vi.fn(),
    } as ReturnType<typeof useMe>);

    render(<SidebarNav />, { wrapper: createWrapper() });
    expect(
      screen.getByRole("button", { name: /시스템 관리/ }),
    ).toBeInTheDocument();
  });

  it("그룹 메뉴는 기본적으로 펼쳐진 상태이다", () => {
    const parentMenu = makeMenu({
      id: "menu-system",
      name: "시스템 관리",
      path: null,
      children: [
        makeMenu({ id: "m-users", name: "관리자 관리", path: "/admin/users" }),
      ],
    });
    vi.mocked(useMe).mockReturnValue({
      isPending: false,
      isError: false,
      data: makeMeResponse([parentMenu]),
      refetch: vi.fn(),
    } as ReturnType<typeof useMe>);

    render(<SidebarNav />, { wrapper: createWrapper() });
    expect(
      screen.getByRole("link", { name: /관리자 관리/ }),
    ).toBeInTheDocument();
  });

  it("그룹 메뉴 버튼 클릭 시 자식 메뉴가 접힌다", async () => {
    const parentMenu = makeMenu({
      id: "menu-system",
      name: "시스템 관리",
      path: null,
      children: [
        makeMenu({ id: "m-users", name: "관리자 관리", path: "/admin/users" }),
      ],
    });
    vi.mocked(useMe).mockReturnValue({
      isPending: false,
      isError: false,
      data: makeMeResponse([parentMenu]),
      refetch: vi.fn(),
    } as ReturnType<typeof useMe>);

    const user = userEvent.setup();
    render(<SidebarNav />, { wrapper: createWrapper() });

    // 초기에는 펼쳐진 상태
    expect(
      screen.getByRole("link", { name: /관리자 관리/ }),
    ).toBeInTheDocument();

    // 클릭하면 접힘
    await user.click(screen.getByRole("button", { name: /시스템 관리/ }));
    expect(
      screen.queryByRole("link", { name: /관리자 관리/ }),
    ).not.toBeInTheDocument();
  });

  it("접힌 그룹 메뉴 버튼을 다시 클릭하면 펼쳐진다", async () => {
    const parentMenu = makeMenu({
      id: "menu-system",
      name: "시스템 관리",
      path: null,
      children: [
        makeMenu({ id: "m-users", name: "관리자 관리", path: "/admin/users" }),
      ],
    });
    vi.mocked(useMe).mockReturnValue({
      isPending: false,
      isError: false,
      data: makeMeResponse([parentMenu]),
      refetch: vi.fn(),
    } as ReturnType<typeof useMe>);

    const user = userEvent.setup();
    render(<SidebarNav />, { wrapper: createWrapper() });

    // 접기
    await user.click(screen.getByRole("button", { name: /시스템 관리/ }));
    expect(
      screen.queryByRole("link", { name: /관리자 관리/ }),
    ).not.toBeInTheDocument();

    // 다시 펼치기
    await user.click(screen.getByRole("button", { name: /시스템 관리/ }));
    expect(
      screen.getByRole("link", { name: /관리자 관리/ }),
    ).toBeInTheDocument();
  });
});
