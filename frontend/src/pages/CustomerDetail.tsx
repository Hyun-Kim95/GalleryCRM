import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { customersApi, Customer, CustomerStatus } from '../api/customers.api';
import { formatDateTime } from '../utils/date';
import { useAuthStore } from '../store/authStore';

export const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: customer, isLoading, error } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customersApi.getById(id!),
    enabled: !!id,
  });

  const getStatusLabel = (status: CustomerStatus): string => {
    switch (status) {
      case CustomerStatus.DRAFT:
        return '초안';
      case CustomerStatus.PENDING:
        return '대기';
      case CustomerStatus.APPROVED:
        return '승인';
      case CustomerStatus.REJECTED:
        return '반려';
      default:
        return status;
    }
  };

  const getStatusColor = (status: CustomerStatus): string => {
    switch (status) {
      case CustomerStatus.DRAFT:
        return '#95a5a6';
      case CustomerStatus.PENDING:
        return '#f39c12';
      case CustomerStatus.APPROVED:
        return '#27ae60';
      case CustomerStatus.REJECTED:
        return '#e74c3c';
      default:
        return '#34495e';
    }
  };

  if (isLoading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">고객 상세</h1>
        </div>
        <div className="card">
          <p style={{ textAlign: 'center', padding: '2rem' }}>로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">고객 상세</h1>
        </div>
        <div className="card">
          <div style={{ backgroundColor: '#fee', color: '#c33', padding: '1rem', borderRadius: '4px' }}>
            고객 정보를 불러올 수 없습니다.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">고객 상세</h1>
        <div className="button-group">
          <Link to="/customers" className="button button-outline">
            목록으로
          </Link>
          {(() => {
            // 수정 가능 조건
            const isCreator = 
              customer.createdById === user?.id || 
              customer.createdBy?.id === user?.id;
            const isAdmin = user?.role === 'ADMIN' || user?.role === 'MASTER';
            
            // 관리자는 모든 상태에서 수정 가능, 작성자는 DRAFT/PENDING/REJECTED 상태에서만 수정 가능
            const canEdit = isAdmin || (
              isCreator && (
                customer.status === CustomerStatus.DRAFT ||
                customer.status === CustomerStatus.PENDING ||
                customer.status === CustomerStatus.REJECTED
              )
            );
            
            return canEdit ? (
              <Link to={`/customers/${customer.id}/edit`} className="button button-primary">
                수정
              </Link>
            ) : null;
          })()}
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>기본 정보</h2>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">이름</label>
            <div style={{ padding: '0.75rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              {customer.isMasked ? '***' : customer.name}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">이메일</label>
            <div style={{ padding: '0.75rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              {customer.isMasked ? '***' : customer.email || '-'}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">전화번호</label>
            <div style={{ padding: '0.75rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              {customer.isMasked ? '***' : customer.phone || '-'}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">주소</label>
            <div style={{ padding: '0.75rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              {customer.isMasked ? '***' : customer.address || '-'}
            </div>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">메모</label>
          <div style={{ padding: '0.75rem', backgroundColor: '#f5f5f5', borderRadius: '4px', minHeight: '100px' }}>
            {customer.isMasked ? '***' : customer.notes || '-'}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>상태 정보</h2>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">상태</label>
            <div style={{ padding: '0.75rem', borderRadius: '4px' }}>
              <span
                className="badge"
                style={{
                  backgroundColor: getStatusColor(customer.status),
                  color: 'white',
                  padding: '0.5rem 1rem',
                }}
              >
                {getStatusLabel(customer.status)}
              </span>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">담당 팀</label>
            <div style={{ padding: '0.75rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              {customer.team?.name || '팀 없음'}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">작성자</label>
            <div style={{ padding: '0.75rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              {customer.createdBy?.name || '-'}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">승인자</label>
            <div style={{ padding: '0.75rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              {customer.approvedBy?.name || '-'}
            </div>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">등록일</label>
            <div style={{ padding: '0.75rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              {formatDateTime(customer.createdAt)}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">승인일</label>
            <div style={{ padding: '0.75rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              {customer.approvedAt ? formatDateTime(customer.approvedAt) : '-'}
            </div>
          </div>
        </div>
        {customer.rejectionReason && (
          <div className="form-group">
            <label className="form-label">반려 사유</label>
            <div style={{ padding: '0.75rem', backgroundColor: '#fee', borderRadius: '4px' }}>
              {customer.rejectionReason}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
