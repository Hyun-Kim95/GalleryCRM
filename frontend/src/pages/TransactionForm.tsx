import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { transactionsApi, CreateTransactionDto } from '../api/transactions.api';
import {
  customersApi,
  Customer,
  CustomerStatus,
} from '../api/customers.api';
import { artistsApi, Artist } from '../api/artists.api';
import { useAuthStore } from '../store/authStore';

export const TransactionForm = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const [customerId, setCustomerId] = useState('');
  const [artistId, setArtistId] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'KRW' | 'USD'>('KRW');
  const [contractTerms, setContractTerms] = useState('');
  const [transactionDate, setTransactionDate] = useState('');

  const { data: customersData } = useQuery({
    queryKey: ['customers', 'for-transaction'],
    queryFn: () =>
      customersApi.search({
        status: CustomerStatus.APPROVED,
        limit: 100,
      }),
  });

  const { data: artists } = useQuery({
    queryKey: ['artists', 'for-transaction'],
    queryFn: () => artistsApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateTransactionDto) => transactionsApi.create(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      navigate(`/transactions/${created.id}`);
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message ?? '거래 생성 중 오류가 발생했습니다.';
      alert(Array.isArray(msg) ? msg.join('\n') : msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerId.trim()) {
      alert('고객을 선택해주세요.');
      return;
    }
    if (!artistId.trim()) {
      alert('작가를 선택해주세요.');
      return;
    }
    if (!amount.trim() || isNaN(Number(amount))) {
      alert('유효한 금액을 입력해주세요.');
      return;
    }
    if (!transactionDate) {
      alert('거래일을 선택해주세요.');
      return;
    }

    const payload: CreateTransactionDto = {
      customerId: customerId.trim(),
      artistId: artistId.trim(),
      amount: Number(amount),
      currency,
      contractTerms: contractTerms.trim() || undefined,
      // backend에서 DateString을 기대하므로 날짜를 그대로 보냅니다 (YYYY-MM-DD)
      transactionDate,
    };

    createMutation.mutate(payload);
  };

  const isLoading = createMutation.isPending;

  return (
    <div>
      <div style={{ marginBottom: '30px' }}>
        <Link to="/transactions" style={{ color: '#3498db', textDecoration: 'none' }}>
          ← 목록으로 돌아가기
        </Link>
        <h1 style={{ margin: '10px 0 0 0' }}>새 거래 등록</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'grid', gap: '20px' }}>
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '5px',
                fontWeight: 'bold',
              }}
            >
              고객 <span style={{ color: '#e74c3c' }}>*</span>
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
              }}
            >
              <option value="">고객을 선택하세요</option>
              {customersData?.data.map((c: Customer) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email || '이메일 없음'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '5px',
                fontWeight: 'bold',
              }}
            >
              작가 <span style={{ color: '#e74c3c' }}>*</span>
            </label>
            <select
              value={artistId}
              onChange={(e) => setArtistId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
              }}
            >
              <option value="">작가를 선택하세요</option>
              {artists?.map((a: Artist) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              금액 <span style={{ color: '#e74c3c' }}>*</span>
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={0}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>통화</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as 'KRW' | 'USD')}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
              }}
            >
              <option value="KRW">KRW (원)</option>
              <option value="USD">USD (달러)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              거래일 <span style={{ color: '#e74c3c' }}>*</span>
            </label>
            <input
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>계약 조건</label>
            <textarea
              value={contractTerms}
              onChange={(e) => setContractTerms(e.target.value)}
              rows={4}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
                fontFamily: 'inherit',
              }}
              placeholder="계약 조건을 입력하세요 (선택)"
            />
          </div>

        </div>

        <div style={{ marginTop: '30px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => navigate('/transactions')}
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
            type="submit"
            disabled={isLoading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = '#2980b9';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = '#3498db';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            {isLoading ? '생성 중...' : '생성'}
          </button>
        </div>
      </form>
    </div>
  );
};


