import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { accessRequestsApi, AccessRequest, AccessRequestStatus, AccessRequestTargetType } from '../api/access-requests.api';
import { formatDateTime } from '../utils/date';
import { useAuthStore } from '../store/authStore';

export const AccessRequestsList: React.FC = () => {
  const queryClient = useQueryClient();
  const [accessDuration, setAccessDuration] = useState(24);
  const { user } = useAuthStore();
  
  // 사원(STAFF)은 승인 권한이 없음
  const canApprove = user?.role !== 'STAFF';

  const { data: requests, isLoading, error } = useQuery({
    queryKey: ['access-requests'],
    queryFn: () => accessRequestsApi.getAll(),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status: AccessRequestStatus.APPROVED | AccessRequestStatus.REJECTED; accessDurationHours?: number; rejectionReason?: string } }) =>
      accessRequestsApi.approve(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-requests'] });
    },
  });

  const handleApprove = (id: string) => {
    approveMutation.mutate({
      id,
      data: { status: AccessRequestStatus.APPROVED, accessDurationHours: accessDuration },
    });
  };

  const handleReject = (id: string) => {
    const reason = prompt('거부 사유를 입력하세요:');
    if (!reason) return;
    approveMutation.mutate({
      id,
      data: { status: AccessRequestStatus.REJECTED, rejectionReason: reason },
    });
  };

  const getStatusLabel = (status: AccessRequestStatus): string => {
    switch (status) {
      case AccessRequestStatus.PENDING:
        return '대기';
      case AccessRequestStatus.APPROVED:
        return '승인';
      case AccessRequestStatus.REJECTED:
        return '거부';
      default:
        return status;
    }
  };

  const getStatusColor = (status: AccessRequestStatus): string => {
    switch (status) {
      case AccessRequestStatus.PENDING:
        return '#f39c12';
      case AccessRequestStatus.APPROVED:
        return '#27ae60';
      case AccessRequestStatus.REJECTED:
        return '#e74c3c';
      default:
        return '#34495e';
    }
  };

  const getTargetTypeLabel = (type: AccessRequestTargetType | string): string => {
    switch (type) {
      case AccessRequestTargetType.CUSTOMER:
        return '고객';
      case AccessRequestTargetType.TRANSACTION:
        return '거래';
      default:
        return type;
    }
  };

  const pendingRequests = requests?.filter((r) => r.status === AccessRequestStatus.PENDING) || [];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">열람 요청</h1>
        {pendingRequests.length > 0 && canApprove && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <label style={{ fontSize: '0.875rem' }}>
              승인 시 열람 시간:
              <input
                type="number"
                min="1"
                max="168"
                value={accessDuration}
                onChange={(e) => setAccessDuration(Number(e.target.value))}
                style={{ marginLeft: '0.5rem', padding: '0.25rem', width: '60px' }}
              />
              시간
            </label>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="card">
          <p style={{ textAlign: 'center', padding: '2rem' }}>로딩 중...</p>
        </div>
      )}

      {error && (
        <div className="card">
          <div style={{ backgroundColor: '#fee', color: '#c33', padding: '1rem', borderRadius: '4px' }}>
            오류가 발생했습니다. 다시 시도해주세요.
          </div>
        </div>
      )}

      {requests && (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>요청자</th>
                  <th>대상 유형</th>
                  <th>대상 ID</th>
                  <th>사유</th>
                  <th>상태</th>
                  <th>요청일</th>
                  <th>만료일</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#95a5a6' }}>
                      열람 요청이 없습니다.
                    </td>
                  </tr>
                ) : (
                  requests.map((request: AccessRequest) => (
                    <tr key={request.id}>
                      <td>{request.requester?.name || '-'}</td>
                      <td>{getTargetTypeLabel(request.targetType)}</td>
                      <td>
                        {request.targetType === AccessRequestTargetType.CUSTOMER && (
                          <Link
                            to={`/customers/${request.targetId}`}
                            style={{ color: '#3498db', textDecoration: 'none' }}
                          >
                            {request.targetId}
                          </Link>
                        )}
                        {request.targetType === AccessRequestTargetType.TRANSACTION && (
                          <Link
                            to={`/transactions/${request.targetId}`}
                            style={{ color: '#3498db', textDecoration: 'none' }}
                          >
                            {request.targetId}
                          </Link>
                        )}
                        {request.targetType !== AccessRequestTargetType.CUSTOMER &&
                          request.targetType !== AccessRequestTargetType.TRANSACTION &&
                          request.targetId}
                      </td>
                      <td>{request.reason || '-'}</td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: getStatusColor(request.status),
                            color: 'white',
                          }}
                        >
                          {getStatusLabel(request.status)}
                        </span>
                      </td>
                      <td>{formatDateTime(request.createdAt)}</td>
                      <td>{request.expiresAt ? formatDateTime(request.expiresAt) : '-'}</td>
                      <td>
                        {request.status === AccessRequestStatus.PENDING && (
                          canApprove ? (
                            <div className="button-group">
                              <button
                                className="button button-primary"
                                onClick={() => handleApprove(request.id)}
                                disabled={approveMutation.isPending}
                              >
                                승인
                              </button>
                              <button
                                className="button button-danger"
                                onClick={() => handleReject(request.id)}
                                disabled={approveMutation.isPending}
                              >
                                거부
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: '#95a5a6', fontSize: '0.875rem' }}>승인 권한 없음</span>
                          )
                        )}
                        {request.status === AccessRequestStatus.APPROVED && request.approvedBy && (
                          <span style={{ fontSize: '0.875rem', color: '#7f8c8d' }}>
                            {request.approvedBy.name} 승인
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
