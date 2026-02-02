import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accessRequestsApi, AccessRequest, AccessRequestStatus, AccessRequestTargetType, CreateAccessRequestDto } from '../api/access-requests.api';
import { useAuthStore } from '../store/authStore';

export const AccessRequestsList = () => {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateAccessRequestDto>({
    targetType: AccessRequestTargetType.CUSTOMER,
    targetId: '',
    reason: '',
  });

  const { data: requests, isLoading, error } = useQuery({
    queryKey: ['access-requests'],
    queryFn: () => accessRequestsApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateAccessRequestDto) => accessRequestsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-requests'] });
      setShowCreateModal(false);
      setCreateForm({ targetType: AccessRequestTargetType.CUSTOMER, targetId: '', reason: '' });
      alert('열람 요청이 생성되었습니다.');
    },
  });

  const handleCreate = () => {
    if (!createForm.targetId.trim()) {
      alert('대상 ID를 입력해주세요.');
      return;
    }
    createMutation.mutate(createForm);
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
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          + 새 열람 요청
        </button>
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
                <th style={{ padding: '12px', textAlign: 'left' }}>만료일</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>요청일</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#95a5a6' }}>
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
                          ? `만료됨 (${new Date(request.expiresAt).toLocaleDateString('ko-KR')})`
                          : new Date(request.expiresAt).toLocaleDateString('ko-KR')
                        : '-'}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#7f8c8d' }}>
                      {new Date(request.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 생성 모달 */}
      {showCreateModal && (
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
          onClick={() => setShowCreateModal(false)}
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
            <h2 style={{ marginTop: 0 }}>새 열람 요청</h2>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                대상 유형 <span style={{ color: '#e74c3c' }}>*</span>
              </label>
              <select
                value={createForm.targetType}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    targetType: e.target.value as AccessRequestTargetType,
                  }))
                }
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px',
                }}
              >
                <option value={AccessRequestTargetType.CUSTOMER}>고객</option>
                <option value={AccessRequestTargetType.TRANSACTION}>거래</option>
              </select>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                대상 ID <span style={{ color: '#e74c3c' }}>*</span>
              </label>
              <input
                type="text"
                value={createForm.targetId}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, targetId: e.target.value }))}
                placeholder="고객 또는 거래 ID를 입력하세요"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px',
                }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>사유</label>
              <textarea
                value={createForm.reason || ''}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, reason: e.target.value }))}
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
                  setShowCreateModal(false);
                  setCreateForm({ targetType: AccessRequestTargetType.CUSTOMER, targetId: '', reason: '' });
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                취소
              </button>
              <button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: createMutation.isPending ? 'not-allowed' : 'pointer',
                }}
              >
                {createMutation.isPending ? '처리 중...' : '요청 생성'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

