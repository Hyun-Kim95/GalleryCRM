import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsApi, CreateTransactionDto, TransactionStatus } from '../api/transactions.api';
import { customersApi } from '../api/customers.api';
import { artistsApi } from '../api/artists.api';
import { useAuthStore } from '../store/authStore';

export const TransactionForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isEdit = !!id;

  const [formData, setFormData] = useState<CreateTransactionDto>({
    customerId: '',
    artistId: '',
    amount: 0,
    currency: 'KRW',
    contractTerms: '',
    transactionDate: new Date().toISOString().split('T')[0],
  });

  const { data: transaction } = useQuery({
    queryKey: ['transaction', id],
    queryFn: () => transactionsApi.getById(id!),
    enabled: isEdit && !!id,
  });

  const { data: customers } = useQuery({
    queryKey: ['customers', 'approved'],
    queryFn: () => customersApi.search({ status: 'APPROVED' as any, limit: 1000 }),
  });

  const { data: artists } = useQuery({
    queryKey: ['artists', 'approved'],
    queryFn: () => artistsApi.getAll(),
  });

  useEffect(() => {
    if (transaction && isEdit) {
      // 백엔드 마스킹/포맷으로 amount가 문자열이 될 수 있어 any로 받아 안전하게 숫자만 추출
      const amountValue: any = transaction.amount as any;
      const rawAmount =
        typeof amountValue === 'string'
          ? Number(amountValue.replace(/[^0-9.-]/g, ''))
          : amountValue ?? 0;

      setFormData({
        customerId: transaction.customerId,
        artistId: transaction.artistId,
        amount: rawAmount,
        currency: transaction.currency || 'KRW',
        contractTerms: transaction.contractTerms || '',
        transactionDate: transaction.transactionDate.split('T')[0],
      });
    }
  }, [transaction, isEdit]);

  const createMutation = useMutation({
    mutationFn: (data: CreateTransactionDto) => transactionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      navigate('/transactions');
    },
    onError: (error: any) => {
      console.error('Transaction creation error:', error);
      const errorMessage = error.response?.data?.message || error.message || '거래 생성 중 오류가 발생했습니다.';
      alert(errorMessage);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 빈 문자열을 undefined로 변환하고 데이터 검증
    const submitData: CreateTransactionDto = {
      customerId: formData.customerId,
      artistId: formData.artistId,
      amount: Number(formData.amount),
      currency: formData.currency || 'KRW',
      transactionDate: formData.transactionDate,
      ...(formData.contractTerms?.trim() && { contractTerms: formData.contractTerms.trim() }),
    };
    
    // 데이터 검증
    if (!submitData.customerId || !submitData.artistId) {
      alert('고객과 작가를 선택해주세요.');
      return;
    }
    
    if (submitData.amount <= 0) {
      alert('금액은 0보다 커야 합니다.');
      return;
    }
    
    if (!submitData.transactionDate) {
      alert('거래일을 선택해주세요.');
      return;
    }
    
    console.log('Submitting transaction data:', submitData);
    createMutation.mutate(submitData);
  };

  const approvedCustomers = customers?.data?.filter((c) => c.status === 'APPROVED') || [];
  const approvedArtists = artists?.filter((a) => a.status === 'APPROVED') || [];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{isEdit ? '거래 수정' : '등록'}</h1>
      </div>

      <div className="card">
        {!isEdit && (
          <div className="form-group" style={{ 
            padding: '0.75rem', 
            backgroundColor: user?.teamId ? '#e8f4f8' : '#fee',
            borderRadius: '4px',
            marginBottom: '1rem',
            border: `1px solid ${user?.teamId ? '#3498db' : '#e74c3c'}`
          }}>
            <div style={{ fontSize: '0.875rem', color: user?.teamId ? '#2c3e50' : '#c33', fontWeight: 500 }}>
              담당 팀: {user?.team?.name || '팀 없음'}
            </div>
            <div style={{ fontSize: '0.75rem', color: user?.teamId ? '#7f8c8d' : (user?.role === 'ADMIN' || user?.role === 'MASTER') ? '#7f8c8d' : '#c33', marginTop: '0.25rem' }}>
              {user?.teamId 
                ? '이 거래는 현재 로그인한 사용자의 팀에 자동으로 할당됩니다.'
                : (user?.role === 'ADMIN' || user?.role === 'MASTER')
                  ? '관리자는 선택한 고객의 팀에 거래가 할당됩니다.'
                  : '⚠️ 거래를 생성하려면 팀에 소속되어 있어야 합니다. 관리자에게 문의하세요.'}
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="form-container">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="customerId" className="form-label">
                고객 <span style={{ color: '#e74c3c' }}>*</span>
              </label>
              <select
                id="customerId"
                className="form-select"
                value={formData.customerId}
                onChange={(e) => setFormData((prev) => ({ ...prev, customerId: e.target.value }))}
                required
                disabled={isEdit}
              >
                <option value="">고객 선택</option>
                {approvedCustomers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} {customer.email ? `(${customer.email})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="artistId" className="form-label">
                작가 <span style={{ color: '#e74c3c' }}>*</span>
              </label>
              <select
                id="artistId"
                className="form-select"
                value={formData.artistId}
                onChange={(e) => setFormData((prev) => ({ ...prev, artistId: e.target.value }))}
                required
                disabled={isEdit}
              >
                <option value="">작가 선택</option>
                {approvedArtists.map((artist) => (
                  <option key={artist.id} value={artist.id}>
                    {artist.name} {artist.nationality ? `(${artist.nationality})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="amount" className="form-label">
                금액 <span style={{ color: '#e74c3c' }}>*</span>
              </label>
              <input
                id="amount"
                type="number"
                className="form-input"
                value={formData.amount || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData((prev) => ({ ...prev, amount: value ? parseFloat(value) : 0 }));
                }}
                min="0"
                step="0.01"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="currency" className="form-label">통화</label>
              <select
                id="currency"
                className="form-select"
                value={formData.currency}
                onChange={(e) => setFormData((prev) => ({ ...prev, currency: e.target.value }))}
              >
                <option value="KRW">KRW (원)</option>
                <option value="USD">USD (달러)</option>
                <option value="EUR">EUR (유로)</option>
                <option value="JPY">JPY (엔)</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="transactionDate" className="form-label">
                거래일 <span style={{ color: '#e74c3c' }}>*</span>
              </label>
              <input
                id="transactionDate"
                type="date"
                className="form-input"
                value={formData.transactionDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, transactionDate: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="contractTerms" className="form-label">계약 조건</label>
            <textarea
              id="contractTerms"
              className="form-textarea"
              value={formData.contractTerms}
              onChange={(e) => setFormData((prev) => ({ ...prev, contractTerms: e.target.value }))}
              rows={5}
            />
          </div>

          <div className="button-group" style={{ marginTop: '1.5rem' }}>
            <button
              type="submit"
              className="button button-primary"
              disabled={createMutation.isPending || (!user?.teamId && user?.role !== 'ADMIN' && user?.role !== 'MASTER')}
            >
              {createMutation.isPending ? '저장 중...' : '저장'}
            </button>
            <button
              type="button"
              className="button button-outline"
              onClick={() => navigate(isEdit ? `/transactions/${id}` : '/transactions')}
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
