/**
 * Auth.js 에러 URL 파라미터를 파싱하여 구조화된 에러 객체를 반환한다.
 *
 * @param error - URL ?error= 파라미터 값
 * @param reason - URL ?reason= 파라미터 값 (사용 안 함, 확장성 위해 보존)
 */
export type AuthErrorType =
  | { type: "pending_approval" }
  | { type: "rejected" }
  | { type: "unknown"; code: string };

export function parseAuthError(
  error: string | undefined,
  reason: string | undefined,
): AuthErrorType | null {
  if (!error) return null;

  if (error === "pending_approval") return { type: "pending_approval" };
  if (error === "rejected") return { type: "rejected" };

  return { type: "unknown", code: error };
}
