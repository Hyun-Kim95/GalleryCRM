# 시드 스크립트 사용 가이드

## 개요

시드 스크립트는 데이터베이스에 초기 데이터를 자동으로 생성하는 도구입니다.

## 실행 방법

```bash
cd backend
npm run seed
```

### 데모 데이터로 초기화 (고객·작가·거래 등 전부 교체)

기존 **팀 전체**, **고객, 작가, 거래, 감사/열람/이력** 및 `admin@example.com` **이외 사용자**를 삭제한 뒤, 갤러리형 데모 팀 2개(아트세일즈 1팀, 큐레이션 운영팀)와 사용자·고객·거래 더미를 넣습니다. **고객·작가 이름·연락처·주소는 실제 기관·인물과 무관한 가상(시드) 데이터**입니다. `admin@example.com` / `admin123` 은 유지됩니다.

```bash
cd backend
npm run seed:demo
```

#### 데모 사용자 — **웹 로그인 가능** (비밀번호 공통 `admin123`)

시드에서 `bcrypt` 해시로 저장하며 `isActive: true`라 `POST /auth/login`·프론트 로그인 폼으로 그대로 들어갈 수 있습니다.

| 이메일 | 역할 | 소속 팀 |
|--------|------|---------|
| `admin@example.com` | MASTER | 없음 |
| `park.minjun@prism-gallery.kr` | MANAGER | 아트세일즈 1팀 |
| `jeong.haeun@prism-gallery.kr` | STAFF | 아트세일즈 1팀 |
| `oh.jihun@prism-gallery.kr` | MANAGER | 큐레이션 운영팀 |
| `kang.yujin@prism-gallery.kr` | STAFF | 큐레이션 운영팀 |

로그인이 안 되면 `npm run seed:demo`를 다시 실행했는지, 이메일·비밀번호 오타가 없는지 확인하세요.

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















