import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsApi, Transaction, TransactionStatus } from '../api/transactions.api';
import { useAuthStore } from '../store/authStore';

export const TransactionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

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
      alert('승인 요청이 완료되었습니다.');
    },
  });

  const handleSubmit = () => {
    if (window.confirm('승인 요청을 제출하시겠습니까?')) {
      submitMutation.mutate();
    }
  };

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.APPROVED:
        return '#27ae60';
      case TransactionStatus.PENDING:
        return '#f39c12';
      case TransactionStatus.REJECTED:
        return '#e74c3c';
      case TransactionStatus.DRAFT:
        return '#95a5a6';
      default:
        return '#34495e';
    }
  };

  const getStatusLabel = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.APPROVED:
        return '승인됨';
      case TransactionStatus.PENDING:
        return '대기중';
      case TransactionStatus.REJECTED:
        return '반려됨';
      case TransactionStatus.DRAFT:
        return '초안';
      default:
        return status;
    }
  };

  const formatAmount = (amount: string | number, currency: string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return amount;
    return new Intl.NumberFormat('ko-KR').format(numAmount) + (currency === 'KRW' ? '원' : ` ${currency}`);
  };

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>로딩 중...</div>;
  }

  if (error || !transaction) {
    return (
      <div>
        <div style={{ backgroundColor: '#e74c3c', color: 'white', padding: '15px', borderRadius: '4px', marginBottom: '20px' }}>
          거래 정보를 불러올 수 없습니다.
        </div>
        <Link to="/transactions" style={{ color: '#3498db', textDecoration: 'none' }}>
          ← 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const canSubmit = transaction.status === TransactionStatus.DRAFT && transaction.createdById === user?.id;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <Link to="/transactions" style={{ color: '#3498db', textDecoration: 'none', marginBottom: '10px', display: 'block' }}>
            ← 목록으로 돌아가기
          </Link>
          <h1 style={{ margin: 0 }}>거래 상세</h1>
        </div>
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
      </div>

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
          <h2 style={{ margin: 0 }}>거래 정보</h2>
          <span
            style={{
              padding: '6px 16px',
              borderRadius: '16px',
              fontSize: '14px',
              fontWeight: 'bold',
              backgroundColor: getStatusColor(transaction.status),
              color: 'white',
            }}
          >
            {getStatusLabel(transaction.status)}
          </span>
        </div>

        {transaction.isMasked && (
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
              고객
            </label>
            <div style={{ fontSize: '16px' }}>
              <Link to={`/customers/${transaction.customerId}`} style={{ color: '#3498db', textDecoration: 'none' }}>
                {transaction.customer?.name || '-'}
              </Link>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: '#7f8c8d' }}>
              작가
            </label>
            <div style={{ fontSize: '16px' }}>{transaction.artist?.name || '-'}</div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: '#7f8c8d' }}>
              금액
            </label>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#27ae60' }}>
              {transaction.isMasked ? '***' : formatAmount(transaction.amount, transaction.currency)}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: '#7f8c8d' }}>
              거래일
            </label>
            <div style={{ fontSize: '16px' }}>
              {new Date(transaction.transactionDate).toLocaleDateString('ko-KR')}
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: '#7f8c8d' }}>
              계약 조건
            </label>
            <div style={{ fontSize: '16px', whiteSpace: 'pre-wrap' }}>
              {transaction.isMasked ? '***' : transaction.contractTerms || '-'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



