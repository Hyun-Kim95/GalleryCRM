import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { transactionsApi, Transaction, TransactionStatus } from '../api/transactions.api';
import { accessRequestsApi, AccessRequestTargetType } from '../api/access-requests.api';
import { formatDate, formatDateTime } from '../utils/date';

export const TransactionsList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | ''>('');

  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ['transactions', statusFilter],
    queryFn: () => transactionsApi.getAll(),
  });

  const createAccessRequestMutation = useMutation({
    mutationFn: ({ transactionId, reason }: { transactionId: string; reason?: string }) =>
      accessRequestsApi.create({
        targetType: AccessRequestTargetType.TRANSACTION,
        targetId: transactionId,
        ...(reason ? { reason } : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-requests'] });
      alert('열람 요청이 등록되었습니다.');
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message || err?.message || '열람 요청 중 오류가 발생했습니다.';
      alert(message);
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
    // 백엔드 마스킹/포맷으로 이미 문자열 형태(예: "111,111,111원")이면 그대로 사용
    if (typeof amount === 'string') {
      return amount;
    }
    if (amount === null || amount === undefined || Number.isNaN(amount)) {
      return `0 ${currency}`;
    }
    const formatted = new Intl.NumberFormat('ko-KR').format(amount);
    return `${formatted} ${currency}`;
  };

  const filteredTransactions = transactions?.filter((transaction) => {
    if (!statusFilter) return true;
    return transaction.status === statusFilter;
  }) || [];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">거래 목록</h1>
        <Link to="/transactions/new" className="button button-primary">
          등록
        </Link>
      </div>

      {/* 필터 */}
      <div className="card">
        <div className="search-filter-container">
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TransactionStatus | '')}
            style={{ minWidth: '150px' }}
          >
            <option value="">전체 상태</option>
            <option value={TransactionStatus.DRAFT}>초안</option>
            <option value={TransactionStatus.PENDING}>대기</option>
            <option value={TransactionStatus.APPROVED}>승인</option>
            <option value={TransactionStatus.REJECTED}>반려</option>
          </select>
        </div>
      </div>

      {/* 결과 테이블 */}
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

      {transactions && (
        <div className="card">
          {/* 마스킹 안내 문구 */}
          {transactions.some((t) => t.isMasked) && (
            <div
              style={{
                marginBottom: '0.75rem',
                padding: '0.5rem 0.75rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                fontSize: '0.8rem',
                color: '#7f8c8d',
              }}
            >
              금액·고객 이름이 <strong>***</strong>로 표시된 행은 마스킹된 거래입니다. 마지막 열의{' '}
              <strong>열람 요청</strong> 버튼을 눌러 필요한 거래에 대해 열람을 요청하세요.
            </div>
          )}
          <div className="table-container">
            <table className="table table-transactions">
              <thead>
                <tr>
                  <th>고객</th>
                  <th>작가</th>
                  <th>금액</th>
                  <th>거래일</th>
                  <th>상태</th>
                  <th>작성자</th>
                  <th className="col-created-at">등록일</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#95a5a6' }}>
                      거래 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction: Transaction) => (
                    <tr
                      key={transaction.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/transactions/${transaction.id}`)}
                    >
                      <td>
                        {transaction.isMasked ? '***' : transaction.customer.name}
                      </td>
                      <td>{transaction.artist.name}</td>
                      <td>{transaction.isMasked ? '***' : formatAmount(transaction.amount, transaction.currency)}</td>
                      <td>{formatDate(transaction.transactionDate)}</td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: getStatusColor(transaction.status),
                            color: 'white',
                          }}
                        >
                          {getStatusLabel(transaction.status)}
                        </span>
                      </td>
                      <td>{transaction.createdBy?.name || '-'}</td>
                      <td className="col-created-at">{formatDate(transaction.createdAt)}</td>
                      <td>
                        {transaction.isMasked ? (
                          <button
                            className="button button-outline"
                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              const reason = window.prompt('열람 사유를 입력하세요. (선택 사항)');
                              createAccessRequestMutation.mutate({
                                transactionId: transaction.id,
                                reason: reason || undefined,
                              });
                            }}
                            disabled={createAccessRequestMutation.isPending}
                          >
                            열람 요청
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#95a5a6' }}>-</span>
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
