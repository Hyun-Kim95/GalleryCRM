# 문서 역할 매핑 (에이전트 워크플로)

`.cursor/rules/00-workflow.mdc`와 `AGENTS.md`에서 말하는 산출물과, 기존 `docs/` 문서의 관계를 정리합니다.

## 기존 문서 (참고·설계)

| 파일 | 역할 |
|------|------|
| [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) | 구현 완료 범위·모듈 요약. **과거/현재 스냅샷**으로 보고, 새 기능의 단일 PRD로 쓰지 않습니다. |
| [API_SUMMARY.md](./API_SUMMARY.md) | API 개요. 변경 시 갱신합니다. |
| [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) | ERD·엔티티 설계. 스키마 변경 시 갱신합니다. |
| [QUICK_START.md](./QUICK_START.md), [SETUP_GUIDE.md](./SETUP_GUIDE.md) | 실행·설정 가이드. |
| [FIGMA_COMMON_RULES.md](./FIGMA_COMMON_RULES.md) | Figma 협업 규칙(해당 시). |

## 워크플로 필수 산출물 (기능 작업 시)

| 파일 | 역할 |
|------|------|
| [research.md](./research.md) | 조사 메모(선택적이나 리서치 단계에서 권장). |
| [prd.md](./prd.md) | **현재 작업**의 요구사항·범위·수용 기준. |
| [frontend-plan.md](./frontend-plan.md) | UI/API 연동·화면 단위 계획. |
| [backend-plan.md](./backend-plan.md) | API·DB·권한 등 서버 측 계획. |
| [ui-spec.md](./ui-spec.md) | UI 변경이 있을 때 상태·문구·플로우. |
| [gate-checklist.md](./gate-checklist.md) | 완료 전 점검 항목. |

**정리**: 범위·승인 기준은 **`prd.md`**에 둡니다. `PROJECT_SUMMARY.md`와 충돌하면 **이번 작업의 `prd.md`와 실제 코드**를 우선하고, 작업 종료 후 요약 문서를 필요하면 갱신합니다.

## 리포트 (`reports/`)

| 파일 | 역할 |
|------|------|
| [test-report.md](../reports/test-report.md) | 테스트·수동 검증 결과. |
| [review.md](../reports/review.md) | 코드/UX 리뷰·blocker. |
| [release-note.md](../reports/release-note.md) | 릴리즈·변경 요약. |

워크플로 상세는 저장소 루트의 `AGENTS.md`와 `.cursor/rules/00-workflow.mdc`를 따릅니다.
