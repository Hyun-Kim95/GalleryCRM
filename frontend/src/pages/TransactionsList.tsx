import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { transactionsApi, Transaction, TransactionStatus } from '../api/transactions.api';
import { accessRequestsApi, AccessRequestTargetType } from '../api/access-requests.api';
import { formatDate } from '../utils/date';
import { formatMoneyAmount } from '../utils/numberFormat';
import { entityStatusBadgeStyle } from '../constants/uiColors';

export const TransactionsList: React.FC = () => {
  const { t } = useTranslation();
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
      alert(t('common.accessRequestSuccess'));
    },
    onError: (err: any) => {
      const message =
        err?.response?.data?.message || err?.message || t('common.accessRequestError');
      alert(message);
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

  const filteredTransactions =
    transactions?.filter((transaction) => {
      if (!statusFilter) return true;
      return transaction.status === statusFilter;
    }) || [];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{t('transactions.title')}</h1>
        <Link to="/transactions/new" className="button button-primary">
          {t('common.register')}
        </Link>
      </div>

      <div className="card">
        <div className="search-filter-container">
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TransactionStatus | '')}
            style={{ minWidth: '150px' }}
          >
            <option value="">{t('common.allStatuses')}</option>
            <option value={TransactionStatus.DRAFT}>{t('status.draft')}</option>
            <option value={TransactionStatus.PENDING}>{t('status.pending')}</option>
            <option value={TransactionStatus.APPROVED}>{t('status.approved')}</option>
            <option value={TransactionStatus.REJECTED}>{t('status.rejected')}</option>
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="card">
          <p className="ui-empty">{t('common.loading')}</p>
        </div>
      )}

      {error && (
        <div className="card">
          <div className="ui-alert-error">{t('common.errorRetry')}</div>
        </div>
      )}

      {transactions && (
        <div className="card">
          {transactions.some((row) => row.isMasked) && (
            <div className="ui-mask-hint" style={{ marginBottom: '0.75rem', fontSize: '0.8rem' }}>
              {t('common.maskHintTransaction')}
            </div>
          )}
          <div className="table-container">
            <table className="table table-transactions">
              <thead>
                <tr>
                  <th>{t('common.customer')}</th>
                  <th>{t('common.artist')}</th>
                  <th>{t('common.amount')}</th>
                  <th>{t('common.transactionDate')}</th>
                  <th>{t('common.status')}</th>
                  <th>{t('common.writer')}</th>
                  <th className="col-created-at">{t('common.createdAtCol')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="ui-empty">
                      {t('transactions.empty')}
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((row: Transaction) => (
                    <tr
                      key={row.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/transactions/${row.id}`)}
                    >
                      <td>{row.isMasked ? '***' : row.customer.name}</td>
                      <td>{row.artist.name}</td>
                      <td>
                        {row.isMasked ? '***' : formatMoneyAmount(row.amount as number | string, row.currency)}
                      </td>
                      <td>{formatDate(row.transactionDate)}</td>
                      <td>
                        <span className="badge" style={entityStatusBadgeStyle(row.status)}>
                          {getStatusLabel(row.status)}
                        </span>
                      </td>
                      <td>{row.createdBy?.name || '-'}</td>
                      <td className="col-created-at">{formatDate(row.createdAt)}</td>
                      <td>
                        {row.isMasked ? (
                          <button
                            className="button button-outline"
                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              const reason = window.prompt(t('common.accessReasonPrompt'));
                              createAccessRequestMutation.mutate({
                                transactionId: row.id,
                                reason: reason || undefined,
                              });
                            }}
                            disabled={createAccessRequestMutation.isPending}
                            type="button"
                          >
                            {t('common.accessRequest')}
                          </button>
                        ) : (
                          <span className="ui-text-muted" style={{ fontSize: '0.75rem' }}>
                            -
                          </span>
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
