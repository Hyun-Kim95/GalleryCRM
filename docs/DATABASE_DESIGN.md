# 데이터베이스 설계서

## ERD 개요

Prism CRM 시스템의 데이터베이스 설계 문서입니다.

## 주요 엔티티

### 1. User (사용자)
- **역할**: Admin, Manager, Staff
- **속성**:
  - id (PK)
  - email (unique)
  - password (암호화)
  - name
  - role (enum: ADMIN, MANAGER, STAFF)
  - teamId (FK → Team)
  - isActive
  - createdAt, updatedAt

### 2. Team (팀)
- **속성**:
  - id (PK)
  - name
  - description
  - isActive
  - createdAt, updatedAt

### 3. Customer (고객)
- **속성**:
  - id (PK)
  - name
  - email
  - phone
  - address
  - notes
  - createdBy (FK → User)
  - teamId (FK → Team)
  - status (enum: DRAFT, PENDING, APPROVED, REJECTED)
  - approvedBy (FK → User, nullable)
  - approvedAt (nullable)
  - rejectionReason (nullable)
  - createdAt, updatedAt

### 4. Artist (작가)
- **속성**:
  - id (PK)
  - name
  - nationality
  - genre
  - bio
  - isActive
  - createdAt, updatedAt

### 5. Transaction (거래)
- **속성**:
  - id (PK)
  - customerId (FK → Customer)
  - artistId (FK → Artist)
  - amount
  - currency
  - contractTerms
  - transactionDate
  - status (enum: DRAFT, PENDING, APPROVED, REJECTED)
  - createdBy (FK → User)
  - teamId (FK → Team)
  - approvedBy (FK → User, nullable)
  - approvedAt (nullable)
  - rejectionReason (nullable)
  - createdAt, updatedAt

### 6. AccessRequest (열람 요청)
- **속성**:
  - id (PK)
  - requesterId (FK → User)
  - targetType (enum: CUSTOMER, TRANSACTION)
  - targetId
  - reason
  - status (enum: PENDING, APPROVED, REJECTED)
  - approvedBy (FK → User, nullable)
  - approvedAt (nullable)
  - expiresAt (nullable) - 승인 시 열람 허용 기간
  - rejectionReason (nullable)
  - createdAt, updatedAt

### 7. AuditLog (감사 로그)
- **속성**:
  - id (PK)
  - userId (FK → User)
  - action (enum: CREATE, UPDATE, DELETE, VIEW, APPROVE, REJECT, ACCESS_REQUEST)
  - entityType (enum: CUSTOMER, TRANSACTION, ARTIST, USER, TEAM)
  - entityId
  - oldValue (JSON, nullable)
  - newValue (JSON, nullable)
  - ipAddress
  - userAgent
  - createdAt

### 8. EntityHistory (엔티티 변경 이력)
- **속성**:
  - id (PK)
  - entityType (enum: CUSTOMER, TRANSACTION)
  - entityId
  - fieldName
  - oldValue
  - newValue
  - changedBy (FK → User)
  - createdAt

## 관계 (Relationships)

1. **User ↔ Team**: Many-to-One
   - 한 사용자는 하나의 팀에 속함
   - 한 팀은 여러 사용자를 가짐

2. **Customer ↔ User**: Many-to-One (createdBy)
   - 고객은 한 사용자에 의해 생성됨

3. **Customer ↔ Team**: Many-to-One
   - 고객은 한 팀에 속함

4. **Transaction ↔ Customer**: Many-to-One
   - 거래는 한 고객에 속함

5. **Transaction ↔ Artist**: Many-to-One
   - 거래는 한 작가에 속함

6. **AccessRequest ↔ User**: Many-to-One (requesterId, approvedBy)
   - 열람 요청은 한 사용자가 요청하고, 한 사용자가 승인

7. **AuditLog ↔ User**: Many-to-One
   - 로그는 한 사용자에 의해 생성됨

## 인덱스 전략

### 고성능 조회를 위한 인덱스
- User: email (unique), teamId
- Customer: teamId, status, createdBy
- Transaction: customerId, artistId, teamId, status, transactionDate
- AccessRequest: requesterId, status, targetType, targetId
- AuditLog: userId, entityType, entityId, createdAt

## 보안 고려사항

1. **민감 데이터 암호화**
   - Customer: email, phone
   - Transaction: amount, contractTerms
   - User: password (bcrypt)

2. **Audit Log 보존**
   - AuditLog, EntityHistory는 삭제 불가
   - soft delete 사용 (isDeleted 플래그)

3. **접근 제어**
   - API 레벨에서 권한 검증
   - 데이터베이스 레벨 RLS (Row Level Security) 고려

## 마이그레이션 전략

1. 초기 마이그레이션: 기본 테이블 생성
2. 시드 데이터: 기본 팀, 관리자 계정 생성
3. 인덱스 마이그레이션: 성능 최적화




