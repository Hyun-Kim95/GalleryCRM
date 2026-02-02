# 빠른 시작 가이드

## 🚀 5단계로 시작하기

### 1단계: PostgreSQL 설치 및 실행
- [PostgreSQL 다운로드](https://www.postgresql.org/download/windows/)
- 설치 후 PostgreSQL 서비스가 실행 중인지 확인

### 2단계: 데이터베이스 생성
PostgreSQL에 접속하여 데이터베이스를 생성합니다:

**방법 1: psql 사용**
```bash
psql -U postgres
CREATE DATABASE gallery_crm;
\q
```

**방법 2: pgAdmin 사용**
- pgAdmin 실행
- 서버 연결 → 우클릭 → Create → Database
- 이름: `gallery_crm`

### 3단계: 환경 변수 설정
`backend/.env` 파일이 이미 생성되어 있습니다. 다음 값만 수정하세요:

```env
DB_PASSWORD=your_actual_postgresql_password  # 실제 PostgreSQL 비밀번호
JWT_SECRET=your_super_secret_jwt_key_min_32_chars  # 강력한 랜덤 문자열
```

### 4단계: Backend 실행 및 테이블 생성
```bash
cd backend
npm install
npm run start:dev
```

서버가 실행되면 TypeORM이 자동으로 테이블을 생성합니다.
- 서버 주소: `http://localhost:3000`
- Swagger 문서: `http://localhost:3000/api`

### 5단계: 초기 데이터 생성
새 터미널에서:
```bash
cd backend
npm run seed
```

이 명령어는 다음을 생성합니다:
- ✅ Management, Sales, Operations 팀
- ✅ 관리자 계정 (이메일: `admin@example.com`, 비밀번호: `admin123`)

### 6단계: Frontend 실행
```bash
cd frontend
npm install
npm start
```

프론트엔드는 `http://localhost:3001`에서 실행됩니다.

## 🔐 첫 로그인

1. 브라우저에서 `http://localhost:3001` 접속
2. 로그인 페이지에서:
   - 이메일: `admin@example.com`
   - 비밀번호: `admin123`
3. **⚠️ 중요**: 로그인 후 즉시 비밀번호를 변경하세요!

## ✅ 확인 사항

- [ ] PostgreSQL 서비스 실행 중
- [ ] 데이터베이스 `gallery_crm` 생성됨
- [ ] `.env` 파일의 비밀번호 설정됨
- [ ] Backend 서버 실행 중 (`http://localhost:3000`)
- [ ] Swagger 문서 접속 가능 (`http://localhost:3000/api`)
- [ ] 시드 스크립트 실행 완료
- [ ] Frontend 실행 중 (`http://localhost:3001`)

## 🆘 문제 해결

### "connection refused" 오류
- PostgreSQL 서비스가 실행 중인지 확인
- `.env` 파일의 `DB_HOST`, `DB_PORT` 확인

### "password authentication failed" 오류
- `.env` 파일의 `DB_PASSWORD`가 실제 PostgreSQL 비밀번호와 일치하는지 확인

### "database does not exist" 오류
- 2단계에서 데이터베이스를 생성했는지 확인
- 데이터베이스 이름이 `gallery_crm`인지 확인

## 📚 다음 단계

- [API 명세서](./API_SUMMARY.md) 확인
- [상세 설정 가이드](./SETUP_GUIDE.md) 참고
- [프로젝트 요약](./PROJECT_SUMMARY.md) 확인

