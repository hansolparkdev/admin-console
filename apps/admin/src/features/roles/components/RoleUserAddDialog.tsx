"use client";

import { useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAddRoleUser } from "@/features/roles/queries";

const schema = z.object({
  userId: z.string().min(1, "사용자 ID를 입력해주세요"),
});

type FormValues = z.infer<typeof schema>;

interface RoleUserAddDialogProps {
  open: boolean;
  onClose: () => void;
  roleId: string;
}

export function RoleUserAddDialog({
  open,
  onClose,
  roleId,
}: RoleUserAddDialogProps) {
  const addMutation = useAddRoleUser(roleId);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    // @ts-expect-error: @hookform/resolvers 5.x 타입이 zod 4.3.x minor 버전을 인식하지 못함. 런타임은 정상 동작.
    resolver: zodResolver(schema),
  });

  if (!open) return null;

  const onSubmit = (values: FormValues) => {
    addMutation.mutate(values.userId, {
      onSuccess: () => {
        reset();
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
          사용자 추가
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                marginBottom: "4px",
              }}
            >
              사용자 ID
            </label>
            <input
              {...register("userId")}
              placeholder="사용자 ID를 입력하세요"
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid var(--border)",
                borderRadius: "4px",
              }}
            />
            {errors.userId && (
              <p
                style={{
                  color: "var(--destructive)",
                  fontSize: "12px",
                  marginTop: "4px",
                }}
              >
                {errors.userId.message}
              </p>
            )}
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
              disabled={addMutation.isPending}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                cursor: "pointer",
                backgroundColor: "var(--primary)",
                color: "var(--primary-foreground)",
                borderRadius: "4px",
              }}
            >
              추가
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
