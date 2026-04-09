import React, { useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { transactionsApi, TransactionStatus } from '../api/transactions.api';
import { formatDate, formatDateTime } from '../utils/date';
import { formatMoneyAmount } from '../utils/numberFormat';
import { useAuthStore } from '../store/authStore';
import { entityStatusBadgeStyle } from '../constants/uiColors';

export const TransactionDetail: React.FC = () => {
  const { t } = useTranslation();
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

  const getStatusLabel = useCallback(
    (status: TransactionStatus): string => {
      switch (status) {
        case TransactionStatus.DRAFT:
          return t('status.draft');
        case TransactionStatus.PENDING:
          return t('status.pending');
        case TransactionStatus.APPROVED:
          return t('status.approved');
        case TransactionStatus.REJECTED:
          return t('status.rejected');
        default:
          return status;
      }
    },
    [t]
  );

  const handleSubmit = () => {
    if (window.confirm(t('common.confirmSubmitTransaction'))) {
      submitMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">{t('transactions.detailTitle')}</h1>
        </div>
        <div className="card">
          <p className="ui-empty">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">{t('transactions.detailTitle')}</h1>
        </div>
        <div className="card">
          <div className="ui-alert-error">{t('transactions.loadError')}</div>
        </div>
      </div>
    );
  }

  const canEdit =
    (transaction.createdById === user?.id ||
      user?.role === 'ADMIN' ||
      user?.role === 'MASTER') &&
    (transaction.status === TransactionStatus.DRAFT ||
      transaction.status === TransactionStatus.REJECTED);

  const canSubmit =
    transaction.status === TransactionStatus.DRAFT &&
    (transaction.createdById === user?.id ||
      user?.role === 'ADMIN' ||
      user?.role === 'MASTER') &&
    transaction.customer?.status === 'APPROVED' &&
    transaction.artist?.status === 'APPROVED';

  const warnMessage =
    transaction.customer?.status !== 'APPROVED' && transaction.artist?.status !== 'APPROVED'
      ? t('transactions.warnBoth')
      : transaction.customer?.status !== 'APPROVED'
        ? t('transactions.warnCustomer')
        : t('transactions.warnArtist');

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{t('transactions.detailTitle')}</h1>
        <div className="button-group">
          <Link to="/transactions" className="button button-outline">
            {t('common.backToList')}
          </Link>
          {canEdit && (
            <Link to={`/transactions/${transaction.id}/edit`} className="button button-primary">
              {t('common.edit')}
            </Link>
          )}
          {canSubmit && (
            <button
              className="button button-primary"
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              type="button"
            >
              {submitMutation.isPending ? t('transactions.submitting') : t('transactions.submitApproval')}
            </button>
          )}
          {transaction.status === TransactionStatus.DRAFT &&
            (transaction.createdById === user?.id ||
              user?.role === 'ADMIN' ||
              user?.role === 'MASTER') &&
            !canSubmit && (
              <div
                className="ui-callout-warning"
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', marginLeft: '0.5rem' }}
              >
                {warnMessage}
              </div>
            )}
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>{t('transactions.sectionInfo')}</h2>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t('common.customer')}</label>
            <div className="ui-field">
              <Link to={`/customers/${transaction.customerId}`} className="ui-link">
                {transaction.isMasked ? '***' : transaction.customer.name}
              </Link>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('common.artist')}</label>
            <div className="ui-field">
              <Link to={`/artists/${transaction.artistId}`} className="ui-link">
                {transaction.artist.name}
              </Link>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('common.amount')}</label>
            <div className="ui-field">
              {transaction.isMasked
                ? '***'
                : formatMoneyAmount(transaction.amount as number | string, transaction.currency)}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('common.transactionDate')}</label>
            <div className="ui-field">{formatDate(transaction.transactionDate)}</div>
          </div>
        </div>
        {transaction.contractTerms && (
          <div className="form-group">
            <label className="form-label">{t('common.contractTerms')}</label>
            <div className="ui-field ui-field--min-h" style={{ whiteSpace: 'pre-wrap' }}>
              {transaction.isMasked ? '***' : transaction.contractTerms}
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>{t('transactions.sectionStatus')}</h2>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t('common.status')}</label>
            <div style={{ padding: '0.75rem' }}>
              <span
                className="badge"
                style={{ ...entityStatusBadgeStyle(transaction.status), padding: '0.5rem 1rem' }}
              >
                {getStatusLabel(transaction.status)}
              </span>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('common.assignedTeam')}</label>
            <div className="ui-field">{transaction.team?.name || t('common.noTeam')}</div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('common.writer')}</label>
            <div className="ui-field">{transaction.createdBy?.name || '-'}</div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('common.approver')}</label>
            <div className="ui-field">{transaction.approvedBy?.name || '-'}</div>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t('common.createdAtCol')}</label>
            <div className="ui-field">{formatDateTime(transaction.createdAt)}</div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('common.approvedAt')}</label>
            <div className="ui-field">
              {transaction.approvedAt ? formatDateTime(transaction.approvedAt) : '-'}
            </div>
          </div>
        </div>
        {transaction.rejectionReason && (
          <div className="form-group">
            <label className="form-label">{t('common.rejectionReason')}</label>
            <div className="ui-rejection-field">{transaction.rejectionReason}</div>
          </div>
        )}
      </div>
    </div>
  );
};
