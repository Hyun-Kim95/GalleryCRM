import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsApi, Transaction, TransactionStatus } from '../api/transactions.api';
import { formatDate, formatDateTime } from '../utils/date';
import { useAuthStore } from '../store/authStore';

export const TransactionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: transaction, isLoading, error } = useQuery({
    queryKey: ['transaction', id],
    queryFn: () => transactionsApi.getById(id!),
    enabled: !!id,
  });

  const submitMutation = useMutation({
    mutationFn: () => transactionsApi.submitForApproval(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction', id] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const getStatusLabel = (status: TransactionStatus): string => {
    switch (status) {
      case TransactionStatus.DRAFT:
        return '초안';
      case TransactionStatus.PENDING:
        return '대기';
      case TransactionStatus.APPROVED:
        return '승인';
      case TransactionStatus.REJECTED:
        return '반려';
      default:
        return status;
    }
  };

  const getStatusColor = (status: TransactionStatus): string => {
    switch (status) {
      case TransactionStatus.DRAFT:
        return '#95a5a6';
      case TransactionStatus.PENDING:
        return '#f39c12';
      case TransactionStatus.APPROVED:
        return '#27ae60';
      case TransactionStatus.REJECTED:
        return '#e74c3c';
      default:
        return '#34495e';
    }
  };

  const formatAmount = (amount: number | string, currency: string = 'KRW'): string => {
    if (typeof amount === 'string') {
      return amount;
    }
    if (amount === null || amount === undefined || Number.isNaN(amount)) {
      return `0 ${currency}`;
    }
    const formatted = new Intl.NumberFormat('ko-KR').format(amount);
    return `${formatted} ${currency}`;
  };

  const handleSubmit = () => {
    if (window.confirm('이 거래를 승인 요청하시겠습니까?')) {
      submitMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">거래 상세</h1>
        </div>
        <div className="card">
          <p style={{ textAlign: 'center', padding: '2rem' }}>로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">거래 상세</h1>
        </div>
        <div className="card">
          <div style={{ backgroundColor: '#fee', color: '#c33', padding: '1rem', borderRadius: '4px' }}>
            거래 정보를 불러올 수 없습니다.
          </div>
        </div>
      </div>
    );
  }

  const canEdit = 
    (transaction.createdById === user?.id || 
     user?.role === 'ADMIN' || 
     user?.role === 'MASTER') &&
    (transaction.status === TransactionStatus.DRAFT || transaction.status === TransactionStatus.REJECTED);

  const canSubmit = 
    transaction.status === TransactionStatus.DRAFT &&
    (transaction.createdById === user?.id || 
     user?.role === 'ADMIN' || 
     user?.role === 'MASTER');

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">거래 상세</h1>
        <div className="button-group">
          <Link to="/transactions" className="button button-outline">
            목록으로
          </Link>
          {canEdit && (
            <Link to={`/transactions/${transaction.id}/edit`} className="button button-primary">
              수정
            </Link>
          )}
          {canSubmit && (
            <button
              className="button button-primary"
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? '제출 중...' : '승인 요청'}
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>거래 정보</h2>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">고객</label>
            <div style={{ padding: '0.75rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              <Link to={`/customers/${transaction.customerId}`} style={{ color: '#3498db', textDecoration: 'none' }}>
                {transaction.isMasked ? '***' : transaction.customer.name}
              </Link>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">작가</label>
            <div style={{ padding: '0.75rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              <Link to={`/artists/${transaction.artistId}`} style={{ color: '#3498db', textDecoration: 'none' }}>
                {transaction.artist.name}
              </Link>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">금액</label>
            <div style={{ padding: '0.75rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              {transaction.isMasked ? '***' : formatAmount(transaction.amount, transaction.currency)}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">거래일</label>
            <div style={{ padding: '0.75rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              {formatDate(transaction.transactionDate)}
            </div>
          </div>
        </div>
        {transaction.contractTerms && (
          <div className="form-group">
            <label className="form-label">계약 조건</label>
            <div style={{ padding: '0.75rem', backgroundColor: '#f5f5f5', borderRadius: '4px', minHeight: '100px', whiteSpace: 'pre-wrap' }}>
              {transaction.isMasked ? '***' : transaction.contractTerms}
            </div>
          </div>
        )}
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
                  backgroundColor: getStatusColor(transaction.status),
                  color: 'white',
                  padding: '0.5rem 1rem',
                }}
              >
                {getStatusLabel(transaction.status)}
              </span>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">담당 팀</label>
            <div style={{ padding: '0.75rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              {transaction.team?.name || '팀 없음'}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">작성자</label>
            <div style={{ padding: '0.75rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              {transaction.createdBy?.name || '-'}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">승인자</label>
            <div style={{ padding: '0.75rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              {transaction.approvedBy?.name || '-'}
            </div>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">등록일</label>
            <div style={{ padding: '0.75rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              {formatDateTime(transaction.createdAt)}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">승인일</label>
            <div style={{ padding: '0.75rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              {transaction.approvedAt ? formatDateTime(transaction.approvedAt) : '-'}
            </div>
          </div>
        </div>
        {transaction.rejectionReason && (
          <div className="form-group">
            <label className="form-label">반려 사유</label>
            <div style={{ padding: '0.75rem', backgroundColor: '#fee', borderRadius: '4px' }}>
              {transaction.rejectionReason}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
