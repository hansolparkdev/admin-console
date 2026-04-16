/**
 * Auth.js v5 관련 순수 유틸리티.
 * Open Redirect 방지, callbackUrl 검증 등.
 */

const DEFAULT_REDIRECT = "/dashboard";

/**
 * callbackUrl이 유효한 상대 경로인지 검증한다.
 * 외부 URL이면 기본 경로로 폴백한다 (Open Redirect 방지).
 *
 * 이유: `/login?callbackUrl=https://evil.com` 같은 공격을 막기 위해
 * 반드시 서버 측에서 검증해야 한다.
 */
export function getCallbackUrl(callbackUrl: string | undefined | null): string {
  if (!callbackUrl) return DEFAULT_REDIRECT;

  // 외부 URL 판별: http://, https://, // 시작이면 거부
  if (/^(https?:)?\/\//.test(callbackUrl)) {
    return DEFAULT_REDIRECT;
  }

  return callbackUrl;
}
