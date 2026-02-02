# Prism - Gallery CRM System

갤러리 내부용 CRM 시스템으로 고객, 작가, 거래 정보를 안전하고 효율적으로 관리하기 위한 사내 전용 시스템입니다.

## 프로젝트 구조

```
GalleryCRM/
├── backend/          # NestJS Backend API
├── frontend/         # React Frontend
└── docs/             # 문서 (ERD, API 명세서 등)
```

## 기술 스택

### Backend
- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT + Passport
- **Validation**: class-validator, class-transformer

### Frontend
- **Framework**: React 19 + TypeScript
- **Routing**: React Router
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Forms**: React Hook Form

## 주요 기능

1. **권한 기반 데이터 마스킹**
   - 사용자 역할(Admin, Manager, Staff)에 따른 데이터 접근 제어
   - 팀 단위 데이터 마스킹

2. **열람 승인 프로세스**
   - 마스킹된 데이터 열람 요청
   - 관리자 승인 후 시간 제한 열람 허용

3. **데이터 등록 승인 워크플로우**
   - Draft → Pending → Approved/Rejected 상태 관리

4. **검색 및 조회**
   - 기본/고급 검색 기능
   - 리스트 + 상세 Split View

5. **활동 로그**
   - 모든 중요 행위 Audit Log 저장
   - 변경 이력 관리

## 빠른 시작

**자세한 가이드는 [QUICK_START.md](./docs/QUICK_START.md)를 참고하세요.**

### 필수 사전 작업 (최초 1회)

1. **PostgreSQL 설치 및 실행**
   - [PostgreSQL 다운로드](https://www.postgresql.org/download/)
   - 설치 후 서비스 실행 확인

2. **데이터베이스 생성**
   ```sql
   CREATE DATABASE gallery_crm;
   ```

3. **환경 변수 설정**
   - `backend/.env` 파일의 `DB_PASSWORD`와 `JWT_SECRET`을 실제 값으로 변경

### 실행 순서

```bash
# 1. Backend 실행 (테이블 자동 생성)
cd backend
npm install
npm run start:dev

# 2. 초기 데이터 생성 (새 터미널)
cd backend
npm run seed

# 3. Frontend 실행 (새 터미널)
cd frontend
npm install
npm start
```

### 첫 로그인
- 이메일: `admin@example.com`
- 비밀번호: `admin123`
- ⚠️ 로그인 후 즉시 비밀번호 변경 권장

## 개발 환경 설정

### Backend

```bash
cd backend
npm install
npm run start:dev
```

서버는 `http://localhost:3000`에서 실행됩니다.
Swagger 문서: `http://localhost:3000/api`

### Frontend

```bash
cd frontend
npm install
npm start
```

프론트엔드는 `http://localhost:3001`에서 실행됩니다.

## 환경 변수

### Backend (.env)

`backend/.env` 파일이 이미 생성되어 있습니다. 다음 값만 수정하세요:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_actual_password  # 실제 PostgreSQL 비밀번호로 변경
DB_DATABASE=gallery_crm

# JWT
JWT_SECRET=your_super_secret_jwt_key_min_32_chars  # 강력한 랜덤 문자열로 변경
JWT_EXPIRES_IN=24h

# Server
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3001
```

## 라이선스

Private - Internal Use Only

