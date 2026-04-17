"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateMenu, useUpdateMenu } from "@/features/menus/queries";
import type { MenuNode } from "../types";

const menuSchema = z.object({
  name: z.string().min(1, "이름은 필수입니다"),
  path: z.string().optional(),
  icon: z.string().optional(),
  isActive: z.boolean().optional(),
  parentId: z.string().optional(),
});

type MenuFormValues = z.infer<typeof menuSchema>;

interface MenuFormDialogProps {
  open: boolean;
  onClose: () => void;
  menu?: MenuNode; // 수정 모드
}

/**
 * 메뉴 생성/수정 다이얼로그.
 * react-hook-form + zod 기반 유효성 검사.
 */
export function MenuFormDialog({ open, onClose, menu }: MenuFormDialogProps) {
  const isEdit = Boolean(menu);
  const createMutation = useCreateMenu();
  const updateMutation = useUpdateMenu();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MenuFormValues>({
    // @ts-expect-error: @hookform/resolvers 5.x 타입이 zod 4.3.x minor 버전을 인식하지 못함. 런타임은 정상 동작.
    resolver: zodResolver(menuSchema),
    defaultValues: {
      name: menu?.name ?? "",
      path: menu?.path ?? "",
      icon: menu?.icon ?? "",
      isActive: menu?.isActive ?? true,
      parentId: menu?.parentId ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: menu?.name ?? "",
        path: menu?.path ?? "",
        icon: menu?.icon ?? "",
        isActive: menu?.isActive ?? true,
        parentId: menu?.parentId ?? "",
      });
    }
  }, [open, menu, reset]);

  const onSubmit = (data: MenuFormValues) => {
    if (isEdit && menu) {
      updateMutation.mutate(
        { id: menu.id, input: data },
        { onSuccess: onClose },
      );
    } else {
      createMutation.mutate(data, { onSuccess: onClose });
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? "메뉴 수정" : "메뉴 생성"}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "var(--background)",
          borderRadius: "12px",
          padding: "24px",
          width: "440px",
          maxWidth: "90vw",
        }}
      >
        <h2 style={{ marginBottom: "16px", fontSize: "18px", fontWeight: 600 }}>
          {isEdit ? "메뉴 수정" : "메뉴 생성"}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div style={{ marginBottom: "16px" }}>
            <label
              htmlFor="menu-name"
              style={{
                display: "block",
                marginBottom: "4px",
                fontSize: "14px",
              }}
            >
              이름 <span style={{ color: "var(--destructive)" }}>*</span>
            </label>
            <input
              id="menu-name"
              type="text"
              {...register("name")}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: `1px solid ${errors.name ? "var(--destructive)" : "var(--border)"}`,
                borderRadius: "6px",
                fontSize: "14px",
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
              htmlFor="menu-path"
              style={{
                display: "block",
                marginBottom: "4px",
                fontSize: "14px",
              }}
            >
              경로
            </label>
            <input
              id="menu-path"
              type="text"
              {...register("path")}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                fontSize: "14px",
              }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              <input type="checkbox" {...register("isActive")} />
              활성화
            </label>
          </div>

          <div
            style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "1px solid var(--border)",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                backgroundColor: "var(--primary)",
                color: "var(--primary-foreground)",
                border: "none",
                cursor: "pointer",
                fontSize: "14px",
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
