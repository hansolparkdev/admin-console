"use client";

import { useState } from "react";
import { useRoles } from "@/features/roles/queries";
import { useAssignUserRole } from "../queries";

interface UserRoleAssignDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
}

export function UserRoleAssignDialog({
  open,
  onClose,
  userId,
}: UserRoleAssignDialogProps) {
  const { data: roles, isPending: rolesLoading } = useRoles();
  const assignMutation = useAssignUserRole(userId);
  const [selectedRoleId, setSelectedRoleId] = useState("");

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoleId) return;
    assignMutation.mutate(selectedRoleId, {
      onSuccess: () => {
        setSelectedRoleId("");
        onClose();
      },
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.4)",
        zIndex: 50,
      }}
    >
      <div
        style={{
          backgroundColor: "var(--background)",
          borderRadius: "8px",
          padding: "24px",
          width: "400px",
          maxWidth: "90vw",
        }}
      >
        <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
          역할 할당
        </h2>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                marginBottom: "4px",
              }}
            >
              역할 선택
            </label>
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              disabled={rolesLoading}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid var(--border)",
                borderRadius: "4px",
              }}
            >
              <option value="">역할을 선택하세요</option>
              {roles?.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!selectedRoleId || assignMutation.isPending}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                cursor: "pointer",
                backgroundColor: "var(--primary)",
                color: "var(--primary-foreground)",
                borderRadius: "4px",
              }}
            >
              할당
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
