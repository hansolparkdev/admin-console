---
name: 서버 포트 중복 기동 차단
description: 에이전트가 이미 실행 중인 포트에 서버를 재기동하는 것 금지
type: feedback
---

에이전트가 사용자가 이미 띄워둔 개발 서버(3000, 3001)를 중복으로 재기동하여 EADDRINUSE 에러를 유발했다.

**Why:** 사용자가 서버를 직접 운영 중인데 에이전트가 임의로 재기동하면 기존 프로세스와 충돌하고, 개발 흐름이 끊긴다.

**How to apply:**
- Bash 도구로 `pnpm dev` / `pnpm start` 계열 명령 실행 전 반드시 `lsof -ti:<port>` 로 포트 점유 확인
- 점유 중이면 새로 띄우지 말고 유저에게 에스컬레이션
- PreToolUse hook(`pre_bash_server.sh`)이 포트 점유 시 exit 2로 차단함
- `dev-workflow.md` §서버 기동 금지 원칙에도 명문화됨
