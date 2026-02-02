# Prism CRM 시스템 설정 가이드

## 사전 요구사항

- Node.js 18+ 
- PostgreSQL 12+
- npm 또는 yarn

## Backend 설정

### 1. 환경 변수 설정

`backend/.env` 파일 생성 (또는 `env.example` 복사):

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=gallery_crm

JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=24h

PORT=3000
NODE_ENV=development

CORS_ORIGIN=http://localhost:3001
```

### 2. 데이터베이스 생성

```sql
CREATE DATABASE gallery_crm;
```

### 3. 의존성 설치 및 실행

```bash
cd backend
npm install
npm run start:dev
```

서버는 `http://localhost:3000`에서 실행됩니다.
Swagger 문서: `http://localhost:3000/api`

## Frontend 설정

### 1. 환경 변수 설정

`frontend/.env` 파일 생성:

```env
REACT_APP_API_URL=http://localhost:3000
```

### 2. 의존성 설치 및 실행

```bash
cd frontend
npm install
npm start
```

프론트엔드는 `http://localhost:3001`에서 실행됩니다.

## 초기 데이터 설정

### 시드 스크립트 실행 (권장)

프로젝트에 포함된 시드 스크립트를 사용하여 초기 데이터를 자동으로 생성할 수 있습니다.

**중요**: 먼저 `.env` 파일의 `DB_PASSWORD`를 실제 PostgreSQL 비밀번호로 변경해야 합니다.

```bash
cd backend
npm run seed
```

이 스크립트는 다음을 자동으로 생성합니다:
- Management 팀
- Sales 팀
- Operations 팀
- 관리자 계정 (이메일: `admin@example.com`, 비밀번호: `admin123`)

**⚠️ 보안 주의**: 초기 로그인 후 반드시 비밀번호를 변경하세요!

### 수동으로 관리자 계정 생성 (선택사항)

시드 스크립트를 사용하지 않는 경우, 데이터베이스에 직접 관리자 계정을 생성할 수 있습니다.

```sql
-- 팀 생성
INSERT INTO teams (id, name, description, is_active, created_at, updated_at)
VALUES (gen_random_uuid(), 'Management', 'Management Team', true, NOW(), NOW());

-- 관리자 계정 생성 (비밀번호는 bcrypt로 암호화 필요)
-- 비밀번호: 'admin123' (bcrypt hash 예시)
INSERT INTO users (id, email, password, name, role, team_id, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@example.com',
  '$2b$10$...', -- bcrypt hash
  'Admin User',
  'ADMIN',
  (SELECT id FROM teams WHERE name = 'Management'),
  true,
  NOW(),
  NOW()
);
```

## 개발 워크플로우

1. Backend 개발 서버 실행: `cd backend && npm run start:dev`
2. Frontend 개발 서버 실행: `cd frontend && npm start`
3. Swagger API 문서 확인: `http://localhost:3000/api`

## 주요 기능 테스트

### 1. 로그인
- POST `/auth/login` 엔드포인트로 로그인
- JWT 토큰을 받아서 이후 요청에 Bearer 토큰으로 포함

### 2. 고객 생성 및 승인
- POST `/customers` - 고객 생성 (Draft)
- POST `/customers/:id/submit` - 승인 요청
- PATCH `/customers/:id/approve` - 승인/반려

### 3. 열람 요청
- POST `/access-requests` - 타 팀 데이터 열람 요청
- PATCH `/access-requests/:id/approve` - 관리자 승인

## 문제 해결

### 데이터베이스 연결 오류
- PostgreSQL 서비스가 실행 중인지 확인
- `.env` 파일의 데이터베이스 정보 확인

### CORS 오류
- Backend의 `CORS_ORIGIN` 환경 변수 확인
- Frontend URL과 일치하는지 확인

### 인증 오류
- JWT 토큰이 만료되었는지 확인
- 로그인 후 토큰이 제대로 저장되었는지 확인

