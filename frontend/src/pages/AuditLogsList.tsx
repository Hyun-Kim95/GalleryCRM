import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditLogsApi, AuditLog, AuditAction, AuditEntityType } from '../api/audit-logs.api';
import { formatDateTime } from '../utils/date';
import { useAuthStore } from '../store/authStore';
import { Link } from 'react-router-dom';

export const AuditLogsList = () => {
  // const user = useAuthStore((state) => state.user);
  const [filters, setFilters] = useState<{
    entityType?: AuditEntityType;
    entityId?: string;
    limit: number;
  }>({
    limit: 100,
  });

  const { data: logs, isLoading, error } = useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () =>
      auditLogsApi.getAll({
        entityType: filters.entityType,
        entityId: filters.entityId,
        limit: filters.limit,
      }),
  });

  const getActionLabel = (action: AuditAction): string => {
    switch (action) {
      case AuditAction.CREATE:
        return '생성';
      case AuditAction.UPDATE:
        return '수정';
      case AuditAction.DELETE:
        return '삭제';
      case AuditAction.VIEW:
        return '조회';
      case AuditAction.APPROVE:
        return '승인';
      case AuditAction.REJECT:
        return '반려';
      case AuditAction.ACCESS_REQUEST:
        return '열람요청';
      default:
        return action;
    }
  };

  const getActionColor = (action: AuditAction): string => {
    switch (action) {
      case AuditAction.CREATE:
        return '#27ae60';
      case AuditAction.UPDATE:
        return '#3498db';
      case AuditAction.DELETE:
        return '#e74c3c';
      case AuditAction.VIEW:
        return '#95a5a6';
      case AuditAction.APPROVE:
        return '#27ae60';
      case AuditAction.REJECT:
        return '#e74c3c';
      case AuditAction.ACCESS_REQUEST:
        return '#9b59b6';
      default:
        return '#34495e';
    }
  };

  const getEntityTypeLabel = (type: AuditEntityType): string => {
    switch (type) {
      case AuditEntityType.CUSTOMER:
        return '고객';
      case AuditEntityType.TRANSACTION:
        return '거래';
      case AuditEntityType.ARTIST:
        return '작가';
      case AuditEntityType.USER:
        return '사용자';
      case AuditEntityType.TEAM:
        return '팀';
      default:
        return type;
    }
  };

  const getEntityLink = (type: AuditEntityType, id: string): string | null => {
    switch (type) {
      case AuditEntityType.CUSTOMER:
        return `/customers/${id}`;
      case AuditEntityType.ARTIST:
        return `/artists/${id}`;
      case AuditEntityType.TRANSACTION:
        return `/transactions/${id}`;
      case AuditEntityType.USER:
        return `/admin/users`;
      case AuditEntityType.TEAM:
        return `/teams`;
      default:
        return null;
    }
  };

  const getFieldLabel = (key: string): string => {
    switch (key) {
      case 'name':
        return '이름';
      case 'email':
        return '이메일';
      case 'phone':
        return '전화번호';
      case 'address':
        return '주소';
      case 'status':
        return '상태';
      case 'reason':
        return '사유';
      case 'rejectionReason':
      case 'rejection_reason':
        return '반려 사유';
      case 'amount':
        return '금액';
      case 'currency':
        return '통화';
      case 'transactionDate':
        return '거래일';
      case 'approvedAt':
        return '승인일';
      case 'createdAt':
        return '등록일';
      case 'updatedAt':
        return '수정일';
      case 'approved':
        return '승인 여부';
      case 'isActive':
        return '활성 여부';
      case 'contractTerms':
      case 'contract_terms':
        return '계약 조건';
      case 'teamId':
        return '팀 ID';
      case 'team':
        return '팀';
      case 'customerId':
        return '고객 ID';
      case 'artistId':
        return '작가 ID';
      case 'createdById':
        return '작성자 ID';
      case 'approvedById':
        return '승인자 ID';
      case 'createdBy':
        return '작성자';
      case 'approvedBy':
        return '승인자';
      default:
        return key;
    }
  };

  const formatValue = (key: string, value: any): string => {
    if (value === null || value === undefined) return '-';

    // 상태 값 한글 변환
    if (typeof value === 'string') {
      const upper = value.toUpperCase();
      if (upper === 'DRAFT') return '초안';
      if (upper === 'PENDING') return '대기';
      if (upper === 'APPROVED') return '승인';
      if (upper === 'REJECTED') return '반려';

      // 불리언/플래그성 필드에 대한 한글 변환
      if (key === 'approved' || key === 'isActive') {
        if (value === 'true' || value === '1') return '예';
        if (value === 'false' || value === '0') return '아니오';
      }

      return value;
    }

    if (typeof value === 'boolean') {
      return value ? '예' : '아니오';
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    // 객체나 배열은 한 줄 JSON으로
    return JSON.stringify(value);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0 }}>활동 기록</h1>
      </div>

      {/* 필터 */}
      <div
        style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>
              엔티티 유형
            </label>
            <select
              value={filters.entityType || ''}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  entityType: e.target.value ? (e.target.value as AuditEntityType) : undefined,
                }))
              }
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            >
              <option value="">전체</option>
              <option value={AuditEntityType.CUSTOMER}>고객</option>
              <option value={AuditEntityType.ARTIST}>작가</option>
              <option value={AuditEntityType.USER}>사용자</option>
              <option value={AuditEntityType.TEAM}>팀</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>
              엔티티 ID
            </label>
            <input
              type="text"
              placeholder="엔티티 ID 입력"
              value={filters.entityId || ''}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  entityId: e.target.value.trim() || undefined,
                }))
              }
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>
              조회 개수
            </label>
            <select
              value={filters.limit}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  limit: parseInt(e.target.value, 10),
                }))
              }
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            >
              <option value={50}>50개</option>
              <option value={100}>100개</option>
              <option value={200}>200개</option>
              <option value={500}>500개</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading && <div style={{ textAlign: 'center', padding: '40px' }}>로딩 중...</div>}
      {error && (
        <div
          style={{
            backgroundColor: '#e74c3c',
            color: 'white',
            padding: '15px',
            borderRadius: '4px',
            marginBottom: '20px',
          }}
        >
          오류가 발생했습니다. 다시 시도해주세요.
        </div>
      )}

      {logs && (
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <div className="table-container">
            <table className="audit-logs-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#34495e', color: 'white' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>일시</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>사용자</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>작업</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>엔티티 유형</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>엔티티 ID</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>상세</th>
                </tr>
              </thead>
              <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#95a5a6' }}>
                    활동 기록이 없습니다.
                  </td>
                </tr>
              ) : (
                logs.map((log: AuditLog) => {
                  const entityLink = getEntityLink(log.entityType, log.entityId);
                  return (
                    <tr
                      key={log.id}
                      style={{
                        borderBottom: '1px solid #ecf0f1',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                      }}
                    >
                      <td style={{ padding: '12px', fontSize: '14px', color: '#7f8c8d' }}>
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td style={{ padding: '12px' }}>{log.user?.name || '-'}</td>
                      <td style={{ padding: '12px' }}>
                        <span
                          style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            backgroundColor: getActionColor(log.action),
                            color: 'white',
                          }}
                        >
                          {getActionLabel(log.action)}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>{getEntityTypeLabel(log.entityType)}</td>
                      <td
                        style={{
                          padding: '12px',
                          maxWidth: '220px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontSize: '12px',
                          color: '#7f8c8d',
                          fontFamily: 'monospace',
                        }}
                        title={log.entityId}
                      >
                        {entityLink ? (
                          <Link
                            to={entityLink}
                            style={{ color: '#3498db', textDecoration: 'none' }}
                          >
                            {log.entityId}
                          </Link>
                        ) : (
                          log.entityId
                        )}
                      </td>
                      <td style={{ padding: '12px', fontSize: '12px', color: '#7f8c8d' }}>
                        {(() => {
                          // 생성/수정/승인 로그는 상세 내용을 별도로 보여주지 않음
                          if (
                            log.action === AuditAction.CREATE ||
                            log.action === AuditAction.UPDATE ||
                            log.action === AuditAction.APPROVE
                          ) {
                            return '-';
                          }

                          const newValue: any = log.newValue || {};
                          const reason: string | undefined =
                            newValue.reason || newValue.rejectionReason || newValue.rejection_reason;

                          if (reason) {
                            return <span>{reason}</span>;
                          }

                          if (log.newValue && Object.keys(log.newValue).length > 0) {
                            const entries = Object.entries(log.newValue);
                            return (
                              <details>
                                <summary style={{ cursor: 'pointer', color: '#3498db' }}>상세 보기</summary>
                                <div
                                  style={{
                                    marginTop: '8px',
                                    padding: '8px',
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    maxWidth: '320px',
                                    maxHeight: '260px',
                                    overflow: 'auto',
                                  }}
                                >
                                  {entries.map(([key, value]) => {
                                    const label = getFieldLabel(key);
                                    return (
                                      <div key={key} style={{ marginBottom: '4px' }}>
                                        <span style={{ fontWeight: 600 }}>{label}</span>
                                        <span style={{ marginLeft: '4px' }}>{formatValue(key, value)}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </details>
                            );
                          }

                          return '-';
                        })()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
};



