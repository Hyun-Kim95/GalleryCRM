# API 명세서 요약

## 인증 (Auth)

### POST /auth/login
- 로그인
- Public 엔드포인트
- Request: `{ email: string, password: string }`
- Response: `{ accessToken: string, user: {...} }`

## 고객 관리 (Customers)

### POST /customers
- 고객 생성 (Draft 상태)
- 권한: 인증된 사용자

### GET /customers
- 고객 검색/조회
- Query Parameters: keyword, status, teamId, startDate, endDate, page, limit
- 권한: 팀별 필터링 자동 적용

### GET /customers/:id
- 고객 상세 조회
- 권한: 본인/팀 데이터 또는 승인된 열람 요청 필요

### PATCH /customers/:id
- 고객 수정
- 권한: 생성자 또는 관리자

### POST /customers/:id/submit
- 승인 요청 (Draft → Pending)

### PATCH /customers/:id/approve
- 승인/반려
- 권한: Admin, Manager

## 거래 관리 (Transactions)

### POST /transactions
- 거래 생성

### GET /transactions
- 거래 목록 조회

### GET /transactions/:id
- 거래 상세 조회

### POST /transactions/:id/submit
- 승인 요청

## 열람 요청 (Access Requests)

### POST /access-requests
- 열람 요청 생성

### GET /access-requests
- 열람 요청 목록 조회

### GET /access-requests/:id
- 열람 요청 상세 조회

### PATCH /access-requests/:id/approve
- 열람 요청 승인/거부
- 권한: Admin

## 기초 데이터

### GET /artists
- 작가 목록 조회

### GET /teams
- 팀 목록 조회

## 데이터 마스킹

모든 API 응답은 자동으로 마스킹 인터셉터를 통해 처리됩니다:
- 본인 데이터: 전체 열람
- 팀 데이터: 부분 마스킹 (Staff), 전체 열람 (Manager)
- 타 팀 데이터: 전체 마스킹

## 권한 체계

- **ADMIN**: 모든 데이터 접근, 승인 권한
- **MANAGER**: 팀 데이터 전체 접근, 승인 권한
- **STAFF**: 팀 데이터 부분 접근, 본인 데이터 전체 접근

