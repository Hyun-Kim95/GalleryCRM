import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi, Customer, CustomerStatus, ApproveCustomerDto } from '../api/customers.api';
import { accessRequestsApi, AccessRequest, AccessRequestStatus, AccessRequestTargetType, CreateAccessRequestDto } from '../api/access-requests.api';
import { useAuthStore } from '../store/authStore';
import { formatDateTime } from '../utils/date';

export const CustomerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveAction, setApproveAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showAccessRequestModal, setShowAccessRequestModal] = useState(false);
  const [accessRequestReason, setAccessRequestReason] = useState('');

  // 고객 상세 조회
  const { data: customer, isLoading, error } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customersApi.getById(id!),
    enabled: !!id,
  });

  // 열람요청 목록 조회
  const { data: allAccessRequests } = useQuery({
    queryKey: ['access-requests'],
    queryFn: () => accessRequestsApi.getAll(),
  });

  // 열람요청 생성
  const createAccessRequestMutation = useMutation({
    mutationFn: (data: CreateAccessRequestDto) => accessRequestsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-requests'] });
      setShowAccessRequestModal(false);
      setAccessRequestReason('');
      alert('열람 요청이 생성되었습니다.');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message ?? '열람 요청 생성 중 오류가 발생했습니다.';
      alert(Array.isArray(msg) ? msg.join('\n') : msg);
    },
  });


  // 승인 요청
  const submitMutation = useMutation({
    mutationFn: () => customersApi.submitForApproval(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      alert('승인 요청이 완료되었습니다.');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message ?? '승인 요청 중 오류가 발생했습니다.';
      alert(Array.isArray(msg) ? msg.join('\n') : msg);
    },
  });

  // 승인/반려
  const approveMutation = useMutation({
    mutationFn: (data: ApproveCustomerDto) => customersApi.approve(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setShowApproveModal(false);
      setRejectionReason('');
      alert(approveAction === 'approve' ? '승인되었습니다.' : '반려되었습니다.');
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message ?? '고객 승인/반려 처리 중 오류가 발생했습니다.';
      alert(Array.isArray(msg) ? msg.join('\n') : msg);
    },
  });

  const handleSubmit = () => {
    if (window.confirm('승인 요청을 제출하시겠습니까?')) {
      submitMutation.mutate();
    }
  };

  const handleApprove = () => {
    if (approveAction === 'reject' && !rejectionReason.trim()) {
      alert('반려 사유를 입력해주세요.');
      return;
    }

    const data: ApproveCustomerDto = {
      status: approveAction === 'approve' ? CustomerStatus.APPROVED : CustomerStatus.REJECTED,
      rejectionReason: approveAction === 'reject' ? rejectionReason : undefined,
    };

    approveMutation.mutate(data);
  };

  const getStatusColor = (status: CustomerStatus) => {
    switch (status) {
      case CustomerStatus.APPROVED:
        return '#27ae60';
      case CustomerStatus.PENDING:
        return '#f39c12';
      case CustomerStatus.REJECTED:
        return '#e74c3c';
      case CustomerStatus.DRAFT:
        return '#95a5a6';
      default:
        return '#34495e';
    }
  };

  const getStatusLabel = (status: CustomerStatus) => {
    switch (status) {
      case CustomerStatus.APPROVED:
        return '승인됨';
      case CustomerStatus.PENDING:
        return '대기중';
      case CustomerStatus.REJECTED:
        return '반려됨';
      case CustomerStatus.DRAFT:
        return '초안';
      default:
        return status;
    }
  };

  const getCustomerAccessRequests = (): AccessRequest[] => {
    if (!allAccessRequests || !id) return [];
    return allAccessRequests.filter(
      (req) => req.targetType === AccessRequestTargetType.CUSTOMER && req.targetId === id
    );
  };

  const getPendingAccessRequests = (): AccessRequest[] => {
    return getCustomerAccessRequests().filter(
      (req) => req.status === AccessRequestStatus.PENDING
    );
  };

  const hasActiveApprovedAccess = (): boolean => {
    const now = new Date();
    return getCustomerAccessRequests().some((req) => {
      if (req.status !== AccessRequestStatus.APPROVED) return false;
      if (!req.expiresAt) return false;
      return new Date(req.expiresAt) > now;
    });
  };

  const getAccessRequestStatusColor = (status: AccessRequestStatus) => {
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

  const getAccessRequestStatusLabel = (status: AccessRequestStatus) => {
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

  const handleCreateAccessRequest = () => {
    if (!accessRequestReason.trim()) {
      alert('열람 사유를 입력해주세요.');
      return;
    }
    createAccessRequestMutation.mutate({
      targetType: AccessRequestTargetType.CUSTOMER,
      targetId: id!,
      reason: accessRequestReason,
    });
  };

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>로딩 중...</div>;
  }

  if (error || !customer) {
    return (
      <div>
        <div style={{ backgroundColor: '#e74c3c', color: 'white', padding: '15px', borderRadius: '4px', marginBottom: '20px' }}>
          고객 정보를 불러올 수 없습니다.
        </div>
        <Link to="/customers" style={{ color: '#3498db', textDecoration: 'none' }}>
          ← 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const canEdit =
    (customer.status === CustomerStatus.DRAFT ||
      customer.status === CustomerStatus.APPROVED ||
      customer.status === CustomerStatus.REJECTED) &&
    (customer.createdById === user?.id || user?.role === 'ADMIN' || user?.role === 'MASTER');
  const canSubmit =
    (customer.status === CustomerStatus.DRAFT ||
      customer.status === CustomerStatus.REJECTED) &&
    (customer.createdById === user?.id || user?.role === 'ADMIN' || user?.role === 'MASTER');
  const canApprove =
    customer.status === CustomerStatus.PENDING &&
    (user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'MASTER');

  const canDelete =
    (customer.status === CustomerStatus.DRAFT ||
      customer.status === CustomerStatus.PENDING ||
      customer.status === CustomerStatus.REJECTED) &&
    (customer.createdById === user?.id || user?.role === 'ADMIN' || user?.role === 'MASTER');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <Link to="/customers" style={{ color: '#3498db', textDecoration: 'none', marginBottom: '10px', display: 'block' }}>
            ← 목록으로 돌아가기
          </Link>
          <h1 style={{ margin: 0 }}>{customer.name}</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {canEdit && (
            <Link
              to={`/customers/${id}/edit`}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3498db',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '4px',
                transition: 'all 0.2s ease',
                display: 'inline-block',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2980b9';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3498db';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              수정
            </Link>
          )}
          {canDelete && (
            <button
              onClick={async () => {
                if (
                  !window.confirm(
                    '해당 고객을 삭제하시겠습니까?\n(삭제 후 1년 경과 시 완전히 삭제됩니다)',
                  )
                ) {
                  return;
                }
                try {
                  await customersApi.softDelete(customer.id);
                  queryClient.invalidateQueries({ queryKey: ['customers'] });
                  navigate('/customers');
                } catch (error: any) {
                  const msg =
                    error?.response?.data?.message ?? '고객 삭제 중 오류가 발생했습니다.';
                  alert(Array.isArray(msg) ? msg.join('\n') : msg);
                }
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#c0392b';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#e74c3c';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              삭제
            </button>
          )}
          {canSubmit && (
            <button
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              style={{
                padding: '10px 20px',
                backgroundColor: '#f39c12',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: submitMutation.isPending ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!submitMutation.isPending) {
                  e.currentTarget.style.backgroundColor = '#e67e22';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (!submitMutation.isPending) {
                  e.currentTarget.style.backgroundColor = '#f39c12';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              {submitMutation.isPending ? '처리 중...' : '승인 요청'}
            </button>
          )}
          {canApprove && (
            <>
              <button
                onClick={() => {
                  setApproveAction('approve');
                  setShowApproveModal(true);
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#229954';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#27ae60';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                승인
              </button>
              <button
                onClick={() => {
                  setApproveAction('reject');
                  setShowApproveModal(true);
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#c0392b';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#e74c3c';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                반려
              </button>
            </>
          )}
          {!(user?.role === 'MASTER' || user?.role === 'MANAGER') && !hasActiveApprovedAccess() && (
            <button
              onClick={() => setShowAccessRequestModal(true)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#9b59b6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#8e44ad';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#9b59b6';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              열람요청
            </button>
          )}
          {getPendingAccessRequests().length > 0 && (
            <button
              onClick={() => navigate('/access-requests')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#16a085',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#138d75';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#16a085';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              열람요청
            </button>
          )}
        </div>
      </div>

      {/* 고객 정보 카드 */}
      <div
        style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>기본 정보</h2>
          <span
            style={{
              padding: '6px 16px',
              borderRadius: '16px',
              fontSize: '14px',
              fontWeight: 'bold',
              backgroundColor: getStatusColor(customer.status),
              color: 'white',
            }}
          >
            {getStatusLabel(customer.status)}
          </span>
        </div>

        {customer.isMasked && (
          <div
            style={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffc107',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '20px',
              color: '#856404',
            }}
          >
            ⚠️ 이 데이터는 마스킹되어 있습니다. 전체 정보를 보려면 열람 요청이 필요합니다.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: '#7f8c8d' }}>
              이름
            </label>
            <div style={{ fontSize: '16px' }}>{customer.name}</div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: '#7f8c8d' }}>
              이메일
            </label>
            <div style={{ fontSize: '16px' }}>{customer.email || '-'}</div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: '#7f8c8d' }}>
              전화번호
            </label>
            <div style={{ fontSize: '16px' }}>{customer.phone || '-'}</div>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: '#7f8c8d' }}>
              주소
            </label>
            <div style={{ fontSize: '16px' }}>{customer.address || '-'}</div>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: '#7f8c8d' }}>
              메모
            </label>
            <div style={{ fontSize: '16px', whiteSpace: 'pre-wrap' }}>{customer.notes || '-'}</div>
          </div>
        </div>
      </div>

      {/* 승인 / 반려 정보 */}
      {(customer.status === CustomerStatus.APPROVED || customer.status === CustomerStatus.REJECTED) && (
        <div
          style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '20px',
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: '20px' }}>
            {customer.status === CustomerStatus.APPROVED ? '승인 정보' : '반려 정보'}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: '#7f8c8d' }}>
                {customer.status === CustomerStatus.APPROVED ? '승인자' : '반려 처리자'}
              </label>
              <div style={{ fontSize: '16px' }}>{customer.approvedBy?.name || '-'}</div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: '#7f8c8d' }}>
                {customer.status === CustomerStatus.APPROVED ? '승인일시' : '반려일시'}
              </label>
              <div style={{ fontSize: '16px' }}>
                {formatDateTime(customer.approvedAt)}
              </div>
            </div>
            {customer.status === CustomerStatus.REJECTED && customer.rejectionReason && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: '#7f8c8d' }}>
                  반려 사유
                </label>
                <div style={{ fontSize: '16px', color: '#e74c3c' }}>{customer.rejectionReason}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 승인/반려 모달 */}
      {showApproveModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowApproveModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '8px',
              width: '500px',
              maxWidth: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0 }}>
              {approveAction === 'approve' ? '고객 승인' : '고객 반려'}
            </h2>
            {approveAction === 'reject' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  반려 사유 <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="반려 사유를 입력하세요"
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                />
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setRejectionReason('');
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#7f8c8d';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#95a5a6';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                취소
              </button>
              <button
                onClick={handleApprove}
                disabled={approveMutation.isPending}
                style={{
                  padding: '10px 20px',
                  backgroundColor: approveAction === 'approve' ? '#27ae60' : '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: approveMutation.isPending ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!approveMutation.isPending) {
                    e.currentTarget.style.backgroundColor = approveAction === 'approve' ? '#229954' : '#c0392b';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!approveMutation.isPending) {
                    e.currentTarget.style.backgroundColor = approveAction === 'approve' ? '#27ae60' : '#e74c3c';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                {approveMutation.isPending ? '처리 중...' : approveAction === 'approve' ? '승인' : '반려'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 열람요청 목록 */}
      {getCustomerAccessRequests().length > 0 && (
        <div
          style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '20px',
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: '20px' }}>열람요청 목록</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {getCustomerAccessRequests().map((request) => (
              <div
                key={request.id}
                style={{
                  padding: '15px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  backgroundColor: '#f8f9fa',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div>
                    <strong>요청자:</strong> {request.requester?.name || '-'} ({request.requester?.email || '-'})
                  </div>
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: getAccessRequestStatusColor(request.status),
                      color: 'white',
                    }}
                  >
                    {getAccessRequestStatusLabel(request.status)}
                  </span>
                </div>
                {request.reason && (
                  <div style={{ marginBottom: '8px', fontSize: '14px', color: '#555' }}>
                    <strong>사유:</strong> {request.reason}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: '#7f8c8d' }}>
                  <div>
                    <strong>요청일시:</strong> {formatDateTime(request.createdAt)}
                  </div>
                  {request.status === AccessRequestStatus.APPROVED && request.expiresAt && (
                    <div>
                      <strong>만료일시:</strong> {formatDateTime(request.expiresAt)}
                    </div>
                  )}
                  {request.approvedBy && (
                    <div>
                      <strong>처리자:</strong> {request.approvedBy.name}
                    </div>
                  )}
                </div>
                {request.status === AccessRequestStatus.REJECTED && request.rejectionReason && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#e74c3c' }}>
                    <strong>거부 사유:</strong> {request.rejectionReason}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 열람요청 생성 모달 */}
      {showAccessRequestModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
          onClick={() => {
            setShowAccessRequestModal(false);
            setAccessRequestReason('');
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '8px',
              width: '500px',
              maxWidth: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0 }}>열람 요청 생성</h2>
            {customer && (
              <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                <strong>고객:</strong> {customer.name}
              </div>
            )}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                열람 사유 <span style={{ color: '#e74c3c' }}>*</span>
              </label>
              <textarea
                value={accessRequestReason}
                onChange={(e) => setAccessRequestReason(e.target.value)}
                placeholder="열람 요청 사유를 입력하세요"
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowAccessRequestModal(false);
                  setAccessRequestReason('');
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#7f8c8d';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#95a5a6';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                취소
              </button>
              <button
                onClick={handleCreateAccessRequest}
                disabled={createAccessRequestMutation.isPending}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#9b59b6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: createAccessRequestMutation.isPending ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!createAccessRequestMutation.isPending) {
                    e.currentTarget.style.backgroundColor = '#8e44ad';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!createAccessRequestMutation.isPending) {
                    e.currentTarget.style.backgroundColor = '#9b59b6';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                {createAccessRequestMutation.isPending ? '처리 중...' : '요청 생성'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

