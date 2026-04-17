"use client";

import { useState } from "react";
import { useMenus } from "@/features/menus/queries";
import { useSetRoleMenuPermissions } from "@/features/roles/queries";
import type { RoleMenuPermission } from "../types";

interface RolePermissionMatrixProps {
  roleId: string;
  initialPermissions: RoleMenuPermission[];
}

function buildPermissionMap(
  perms: RoleMenuPermission[],
): Record<string, RoleMenuPermission> {
  const map: Record<string, RoleMenuPermission> = {};
  for (const p of perms) {
    map[p.menuId] = p;
  }
  return map;
}

export function RolePermissionMatrix({
  roleId,
  initialPermissions,
}: RolePermissionMatrixProps) {
  const { data: menus, isPending, isError } = useMenus();
  const saveMutation = useSetRoleMenuPermissions();

  // initialPermissions로 초기 상태 설정 (useEffect 없이 직접 초기화)
  const [permissions, setPermissions] = useState<
    Record<string, RoleMenuPermission>
  >(() => buildPermissionMap(initialPermissions));

  if (isPending) {
    return (
      <div data-testid="permission-matrix-loading" style={{ padding: "16px" }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: "40px",
              borderRadius: "6px",
              backgroundColor: "var(--muted)",
              marginBottom: "8px",
            }}
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ color: "var(--destructive)", padding: "16px" }}>
        메뉴를 불러올 수 없습니다.
      </div>
    );
  }

  if (!menus || menus.length === 0) {
    return (
      <div style={{ color: "var(--muted-foreground)", padding: "16px" }}>
        등록된 메뉴가 없습니다.
      </div>
    );
  }

  const togglePermission = (
    menuId: string,
    field: keyof Omit<RoleMenuPermission, "menuId">,
  ) => {
    setPermissions((prev) => {
      const current = prev[menuId] ?? {
        menuId,
        canRead: false,
        canWrite: false,
        canDelete: false,
      };
      return {
        ...prev,
        [menuId]: { ...current, [field]: !current[field] },
      };
    });
  };

  const handleSave = () => {
    const perms = menus.map((menu) => {
      const p = permissions[menu.id] ?? {
        menuId: menu.id,
        canRead: false,
        canWrite: false,
        canDelete: false,
      };
      return {
        menuId: menu.id,
        canRead: p.canRead,
        canWrite: p.canWrite,
        canDelete: p.canDelete,
      };
    });
    saveMutation.mutate({ roleId, permissions: perms });
  };

  return (
    <div>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "16px",
        }}
      >
        <thead>
          <tr style={{ borderBottom: "2px solid var(--border)" }}>
            <th
              style={{
                padding: "10px 16px",
                textAlign: "left",
                fontSize: "14px",
              }}
            >
              메뉴
            </th>
            <th
              style={{
                padding: "10px 8px",
                textAlign: "center",
                fontSize: "14px",
              }}
            >
              읽기
            </th>
            <th
              style={{
                padding: "10px 8px",
                textAlign: "center",
                fontSize: "14px",
              }}
            >
              쓰기
            </th>
            <th
              style={{
                padding: "10px 8px",
                textAlign: "center",
                fontSize: "14px",
              }}
            >
              삭제
            </th>
          </tr>
        </thead>
        <tbody>
          {menus.map((menu) => {
            const perm = permissions[menu.id] ?? {
              canRead: false,
              canWrite: false,
              canDelete: false,
            };
            return (
              <tr
                key={menu.id}
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <td style={{ padding: "10px 16px", fontSize: "14px" }}>
                  {menu.name}
                </td>
                <td style={{ padding: "10px 8px", textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={perm.canRead}
                    onChange={() => togglePermission(menu.id, "canRead")}
                    aria-label={`${menu.name} 읽기`}
                  />
                </td>
                <td style={{ padding: "10px 8px", textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={perm.canWrite}
                    onChange={() => togglePermission(menu.id, "canWrite")}
                    aria-label={`${menu.name} 쓰기`}
                  />
                </td>
                <td style={{ padding: "10px 8px", textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={perm.canDelete}
                    onChange={() => togglePermission(menu.id, "canDelete")}
                    aria-label={`${menu.name} 삭제`}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={saveMutation.isPending}
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            cursor: "pointer",
            backgroundColor: "var(--primary)",
            color: "var(--primary-foreground)",
            borderRadius: "4px",
          }}
        >
          저장
        </button>
      </div>
    </div>
  );
}
