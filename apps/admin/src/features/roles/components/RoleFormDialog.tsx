"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateRole, useUpdateRole } from "@/features/roles/queries";
import type { Role } from "../types";

const schema = z.object({
  name: z.string().min(1, "역할명을 입력해주세요"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface RoleFormDialogProps {
  open: boolean;
  onClose: () => void;
  role?: Role;
}

export function RoleFormDialog({ open, onClose, role }: RoleFormDialogProps) {
  const isEdit = Boolean(role);
  const createMutation = useCreateRole();
  const updateMutation = useUpdateRole();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    // @ts-expect-error: @hookform/resolvers 5.x 타입이 zod 4.3.x minor 버전을 인식하지 못함. 런타임은 정상 동작.
    resolver: zodResolver(schema),
    defaultValues: {
      name: role?.name ?? "",
      description: role?.description ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: role?.name ?? "",
        description: role?.description ?? "",
      });
    }
  }, [open, role, reset]);

  if (!open) return null;

  const onSubmit = (values: FormValues) => {
    if (isEdit && role) {
      updateMutation.mutate(
        {
          id: role.id,
          input: { name: values.name, description: values.description },
        },
        { onSuccess: onClose },
      );
    } else {
      createMutation.mutate(
        { name: values.name, description: values.description },
        { onSuccess: onClose },
      );
    }
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
          {isEdit ? "역할 수정" : "역할 추가"}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div style={{ marginBottom: "12px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                marginBottom: "4px",
              }}
            >
              역할명
            </label>
            <input
              {...register("name")}
              placeholder="역할명을 입력하세요"
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid var(--border)",
                borderRadius: "4px",
              }}
            />
            {errors.name && (
              <p
                style={{
                  color: "var(--destructive)",
                  fontSize: "12px",
                  marginTop: "4px",
                }}
              >
                {errors.name.message}
              </p>
            )}
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                marginBottom: "4px",
              }}
            >
              설명
            </label>
            <input
              {...register("description")}
              placeholder="설명을 입력하세요 (선택)"
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid var(--border)",
                borderRadius: "4px",
              }}
            />
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
              disabled={createMutation.isPending || updateMutation.isPending}
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
        </form>
      </div>
    </div>
  );
}
