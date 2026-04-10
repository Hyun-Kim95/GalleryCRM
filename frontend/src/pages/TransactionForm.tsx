import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { transactionsApi, CreateTransactionDto, UpdateTransactionDto } from '../api/transactions.api';
import { customersApi } from '../api/customers.api';
import { artistsApi } from '../api/artists.api';
import { useAuthStore } from '../store/authStore';
export const TransactionForm: React.FC = () => {
  const { t } = useTranslation();
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

  const { data: artistsData } = useQuery({
    queryKey: ['artists', 'approved'],
    queryFn: () => artistsApi.search({ status: 'APPROVED' as any, limit: 1000 }),
  });

  useEffect(() => {
    if (transaction && isEdit) {
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
      const errorMessage =
        error.response?.data?.message || error.message || t('transactions.createError');
      alert(errorMessage);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateTransactionDto) => transactionsApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction', id] });
      navigate(`/transactions/${id}`);
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || error.message || t('transactions.updateError');
      alert(errorMessage);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerId || !formData.artistId) {
      alert(t('transactions.validationCustomerArtist'));
      return;
    }

    if (formData.amount <= 0) {
      alert(t('transactions.validationAmount'));
      return;
    }

    if (!formData.transactionDate) {
      alert(t('transactions.validationDate'));
      return;
    }

    if (isEdit) {
      const updateData: UpdateTransactionDto = {
        customerId: formData.customerId,
        artistId: formData.artistId,
        amount: Number(formData.amount),
        currency: formData.currency || 'KRW',
        transactionDate: formData.transactionDate,
        ...(formData.contractTerms?.trim() && { contractTerms: formData.contractTerms.trim() }),
      };
      updateMutation.mutate(updateData);
    } else {
      const submitData: CreateTransactionDto = {
        customerId: formData.customerId,
        artistId: formData.artistId,
        amount: Number(formData.amount),
        currency: formData.currency || 'KRW',
        transactionDate: formData.transactionDate,
        ...(formData.contractTerms?.trim() && { contractTerms: formData.contractTerms.trim() }),
      };
      createMutation.mutate(submitData);
    }
  };

  const approvedCustomers = customers?.data?.filter((c) => c.status === 'APPROVED') || [];
  const approvedArtists = artistsData?.data || [];

  const allCustomers = useMemo(() => {
    if (!isEdit || !transaction) return approvedCustomers;

    const currentCustomer = approvedCustomers.find((c) => c.id === transaction.customerId);
    if (currentCustomer) return approvedCustomers;

    return [
      ...approvedCustomers,
      {
        id: transaction.customerId,
        name: transaction.customer?.name || t('common.unknown'),
        email: transaction.customer?.email || null,
        phone: null,
        address: null,
        notes: null,
        status: 'APPROVED' as any,
        createdById: '',
        createdBy: null,
        teamId: '',
        team: null,
        approvedById: null,
        approvedBy: null,
        approvedAt: null,
        rejectionReason: null,
        createdAt: '',
        updatedAt: '',
        isMasked: false,
      },
    ];
  }, [approvedCustomers, isEdit, transaction, t]);

  const allArtists = useMemo(() => {
    if (!isEdit || !transaction) return approvedArtists;

    const currentArtist = approvedArtists.find((a) => a.id === transaction.artistId);
    if (currentArtist) return approvedArtists;

    return [
      ...approvedArtists,
      {
        id: transaction.artistId,
        name: transaction.artist?.name || t('common.unknown'),
        nationality: null,
        genre: null,
        bio: null,
        isActive: true,
        status: 'APPROVED' as any,
        createdById: null,
        createdBy: null,
        approvedById: null,
        approvedBy: null,
        approvedAt: null,
        rejectionReason: null,
        createdAt: '',
        updatedAt: '',
      },
    ];
  }, [approvedArtists, isEdit, transaction, t]);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{isEdit ? t('transactions.editTitle') : t('transactions.newTitle')}</h1>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="form-container">
          {!isEdit && (
            <div
              className="form-group"
              style={{
                padding: '0.75rem',
                backgroundColor: user?.teamId ? 'var(--info-bg)' : 'var(--error-bg)',
                borderRadius: 'var(--radius)',
                marginBottom: '1rem',
                border: user?.teamId
                  ? '1px solid var(--border-default)'
                  : '1px solid var(--error-border)',
              }}
            >
              <div
                style={{
                  fontSize: '0.875rem',
                  color: user?.teamId ? 'var(--foreground)' : 'var(--error-text)',
                  fontWeight: 500,
                }}
              >
                {t('transactions.teamHint', { team: user?.team?.name || t('common.noTeam') })}
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color:
                    user?.teamId ||
                    user?.role === 'ADMIN' ||
                    user?.role === 'MASTER'
                      ? 'var(--text-muted)'
                      : 'var(--error-text)',
                  marginTop: '0.25rem',
                }}
              >
                {user?.teamId
                  ? t('transactions.teamAssignStaff')
                  : user?.role === 'ADMIN' || user?.role === 'MASTER'
                    ? t('transactions.teamAssignAdmin')
                    : t('transactions.teamRequired')}
              </div>
            </div>
          )}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="customerId" className="form-label">
                {t('common.customer')} <span className="ui-required">*</span>
              </label>
              <select
                id="customerId"
                className="form-select"
                value={formData.customerId}
                onChange={(e) => setFormData((prev) => ({ ...prev, customerId: e.target.value }))}
                required
                disabled={isEdit}
              >
                <option value="">{t('transactions.selectCustomer')}</option>
                {allCustomers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} {customer.email ? `(${customer.email})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="artistId" className="form-label">
                {t('common.artist')} <span className="ui-required">*</span>
              </label>
              <select
                id="artistId"
                className="form-select"
                value={formData.artistId}
                onChange={(e) => setFormData((prev) => ({ ...prev, artistId: e.target.value }))}
                required
              >
                <option value="">{t('transactions.selectArtist')}</option>
                {allArtists.map((artist) => (
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
                {t('common.amount')} <span className="ui-required">*</span>
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
              <label htmlFor="currency" className="form-label">
                {t('common.currency')}
              </label>
              <select
                id="currency"
                className="form-select"
                value={formData.currency}
                onChange={(e) => setFormData((prev) => ({ ...prev, currency: e.target.value }))}
              >
                <option value="KRW">{t('common.currencyKRW')}</option>
                <option value="USD">{t('common.currencyUSD')}</option>
                <option value="EUR">{t('common.currencyEUR')}</option>
                <option value="JPY">{t('common.currencyJPY')}</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="transactionDate" className="form-label">
                {t('common.transactionDate')} <span className="ui-required">*</span>
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
            <label htmlFor="contractTerms" className="form-label">
              {t('common.contractTerms')}
            </label>
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
              disabled={
                (isEdit ? updateMutation.isPending : createMutation.isPending) ||
                (!isEdit && !user?.teamId && user?.role !== 'ADMIN' && user?.role !== 'MASTER')
              }
            >
              {isEdit
                ? updateMutation.isPending
                  ? t('common.saving')
                  : t('common.save')
                : createMutation.isPending
                  ? t('common.saving')
                  : t('common.save')}
            </button>
            <button
              type="button"
              className="button button-outline"
              onClick={() => navigate(isEdit ? `/transactions/${id}` : '/transactions')}
            >
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
