# 시드 스크립트 사용 가이드

## 개요

시드 스크립트는 데이터베이스에 초기 데이터를 자동으로 생성하는 도구입니다.

## 실행 방법

```bash
cd backend
npm run seed
```

## 생성되는 데이터

### 팀 (Teams)
- **Management** - 관리 팀
- **Sales** - 영업 팀
- **Operations** - 운영 팀

### 사용자 (Users)
- **관리자 계정**
  - 이메일: `admin@example.com`
  - 비밀번호: `admin123`
  - 역할: `ADMIN`
  - 소속: Management 팀

## 주의사항

1. **환경 변수 확인**
   - `.env` 파일이 존재하고 올바르게 설정되어 있어야 합니다.
   - 특히 `DB_PASSWORD`가 실제 PostgreSQL 비밀번호와 일치해야 합니다.

2. **데이터베이스 연결**
   - PostgreSQL 서비스가 실행 중이어야 합니다.
   - `gallery_crm` 데이터베이스가 생성되어 있어야 합니다.

3. **중복 실행**
   - 시드 스크립트는 중복 실행해도 안전합니다.
   - 이미 존재하는 데이터는 건너뛰고 새 데이터만 생성합니다.

4. **보안**
   - 초기 관리자 비밀번호(`admin123`)는 테스트용입니다.
   - 프로덕션 환경에서는 반드시 변경하세요!

## 문제 해결

### "Cannot connect to database" 오류
- PostgreSQL 서비스가 실행 중인지 확인
- `.env` 파일의 데이터베이스 정보 확인

### "password authentication failed" 오류
- `.env` 파일의 `DB_PASSWORD` 확인
- PostgreSQL 사용자 비밀번호와 일치하는지 확인

### "database does not exist" 오류
- 데이터베이스 생성: `CREATE DATABASE gallery_crm;`



