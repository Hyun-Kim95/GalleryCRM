import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accessRequestsApi, AccessRequest, AccessRequestStatus, AccessRequestTargetType, ApproveAccessRequestDto } from '../api/access-requests.api';
import { useAuthStore } from '../store/authStore';
import { formatDateTime } from '../utils/date';

export const AccessRequestsList = () => {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const { data: requests, isLoading, error } = useQuery({
    queryKey: ['access-requests'],
    queryFn: () => accessRequestsApi.getAll(),
  });

  // 열람요청 승인/거부
  const approveAccessRequestMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ApproveAccessRequestDto }) =>
      accessRequestsApi.approve(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-requests'] });
      alert('처리되었습니다.');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message ?? '열람 요청 승인/거부 중 오류가 발생했습니다.';
      alert(Array.isArray(msg) ? msg.join('\n') : msg);
    },
  });

  const handleApproveAccessRequest = (request: AccessRequest, action: 'approve' | 'reject') => {
    if (action === 'reject') {
      const rejectionReason = prompt('거부 사유를 입력하세요:');
      if (!rejectionReason) return;

      const data: ApproveAccessRequestDto = {
        status: AccessRequestStatus.REJECTED,
        rejectionReason,
      };
      approveAccessRequestMutation.mutate({ id: request.id, data });
    } else {
      const hours = prompt('열람 허용 기간(시간)을 입력하세요 (기본: 24):', '24');
      const accessDurationHours = hours ? parseInt(hours) : 24;

      const data: ApproveAccessRequestDto = {
        status: AccessRequestStatus.APPROVED,
        accessDurationHours,
      };
      approveAccessRequestMutation.mutate({ id: request.id, data });
    }
  };

  const getStatusColor = (status: AccessRequestStatus) => {
    switch (status) {
      case AccessRequestStatus.APPROVED:
        return '#27ae60';
      case AccessRequestStatus.PENDING:
        return '#f39c12';
      case AccessRequestStatus.REJECTED:
        return '#e74c3c';
      default:
        return '#34495e';
    }
  };

  const getStatusLabel = (status: AccessRequestStatus) => {
    switch (status) {
      case AccessRequestStatus.APPROVED:
        return '승인됨';
      case AccessRequestStatus.PENDING:
        return '대기중';
      case AccessRequestStatus.REJECTED:
        return '거부됨';
      default:
        return status;
    }
  };

  const getTargetTypeLabel = (type: AccessRequestTargetType) => {
    switch (type) {
      case AccessRequestTargetType.CUSTOMER:
        return '고객';
      case AccessRequestTargetType.TRANSACTION:
        return '거래';
      default:
        return type;
    }
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0 }}>열람 요청</h1>
      </div>

      {isLoading && <div style={{ textAlign: 'center', padding: '40px' }}>로딩 중...</div>}
      {error && (
        <div style={{ backgroundColor: '#e74c3c', color: 'white', padding: '15px', borderRadius: '4px', marginBottom: '20px' }}>
          오류가 발생했습니다. 다시 시도해주세요.
        </div>
      )}

      {requests && (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#34495e', color: 'white' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>요청자</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>대상 유형</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>대상 ID</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>사유</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>상태</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>만료일시</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>요청일시</th>
                {(user?.role === 'MASTER' || user?.role === 'MANAGER') && (
                  <th style={{ padding: '12px', textAlign: 'left' }}>작업</th>
                )}
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={(user?.role === 'MASTER' || user?.role === 'MANAGER') ? 8 : 7} style={{ padding: '40px', textAlign: 'center', color: '#95a5a6' }}>
                    열람 요청이 없습니다.
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr
                    key={request.id}
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
                    <td style={{ padding: '12px' }}>{request.requester?.name || '-'}</td>
                    <td style={{ padding: '12px' }}>{getTargetTypeLabel(request.targetType)}</td>
                    <td style={{ padding: '12px' }}>
                      <a
                        href={`/${request.targetType === AccessRequestTargetType.CUSTOMER ? 'customers' : 'transactions'}/${request.targetId}`}
                        style={{ color: '#3498db', textDecoration: 'none' }}
                      >
                        {request.targetId}
                      </a>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#7f8c8d' }}>
                      {request.reason || '-'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: getStatusColor(request.status),
                          color: 'white',
                        }}
                      >
                        {getStatusLabel(request.status)}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#7f8c8d' }}>
                      {request.expiresAt
                        ? isExpired(request.expiresAt)
                          ? `만료됨 (${formatDateTime(request.expiresAt)})`
                          : formatDateTime(request.expiresAt)
                        : '-'}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#7f8c8d' }}>
                      {formatDateTime(request.createdAt)}
                    </td>
                    {(user?.role === 'MASTER' || user?.role === 'MANAGER') && (
                      <td style={{ padding: '12px' }}>
                        {request.status === AccessRequestStatus.PENDING ? (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleApproveAccessRequest(request, 'approve')}
                              disabled={approveAccessRequestMutation.isPending}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#27ae60',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: approveAccessRequestMutation.isPending ? 'not-allowed' : 'pointer',
                              }}
                            >
                              승인
                            </button>
                            <button
                              onClick={() => handleApproveAccessRequest(request, 'reject')}
                              disabled={approveAccessRequestMutation.isPending}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#e74c3c',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: approveAccessRequestMutation.isPending ? 'not-allowed' : 'pointer',
                              }}
                            >
                              거부
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: '#95a5a6', fontSize: '12px' }}>-</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};


