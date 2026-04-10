# Gate checklist — 완료 전 점검

기능 작업 완료 선언 전에 확인합니다. (`AGENTS.md` / `.cursor/rules/00-workflow.mdc` 정렬)

## 빌드·테스트

- [ ] `backend`: `npm run build` (필요 시 `npm test`, `npm run test:e2e`)
- [ ] `frontend`: `npm run build` (필요 시 `npm test`)
- [ ] 변경 동작에 대한 자동 테스트 또는 명시적 수동 검증 절차 존재

## 기능·회귀

- [ ] PRD 수용 기준 충족
- [ ] 권한·마스킹·승인 플로우 등 핵심 경로 회귀 없음
- [ ] API/타입/스키마 불일치 없음

## UX (UI 변경 시)

- [ ] 라벨·페이지 제목·토스트/얼럿·validation·빈/로딩/에러 상태 점검
- [ ] 데스크톱·모바일 레이아웃 무난

## 문서·리포트

- [ ] `reports/test-report.md`에 검증 근거 반영
- [ ] `reports/review.md` 반영 또는 blocker 해소 확인
- [ ] 실행 방법·환경 변수·API 변경 시 `README.md` 또는 `docs/` 갱신

## Blocker

- [ ] 알려진 blocker 없음, 또는 사용자 수용·문서화됨
