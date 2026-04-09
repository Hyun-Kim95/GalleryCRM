import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { customersApi, Customer, CustomerStatus } from '../api/customers.api';
import { artistsApi, Artist, ArtistStatus } from '../api/artists.api';
import { transactionsApi, Transaction, TransactionStatus } from '../api/transactions.api';
import { formatDate } from '../utils/date';
import { formatMoneyAmount } from '../utils/numberFormat';
import { useAuthStore } from '../store/authStore';

export const ApprovalsDashboard: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const canApprove = user?.role !== 'STAFF';

  const { data: customersData } = useQuery({
    queryKey: ['customers', 'pending'],
    queryFn: () => customersApi.search({ status: CustomerStatus.PENDING, limit: 100 }),
  });

  const { data: artists } = useQuery({
    queryKey: ['artists', 'pending'],
    queryFn: () => artistsApi.getPending(),
  });

  const { data: transactions } = useQuery({
    queryKey: ['transactions', 'pending'],
    queryFn: () => transactionsApi.getAll(),
  });

  const approveCustomerMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { status: CustomerStatus.APPROVED | CustomerStatus.REJECTED; rejectionReason?: string };
    }) => customersApi.approve(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  const approveArtistMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { status: ArtistStatus; rejectionReason?: string };
    }) => artistsApi.approve(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artists'] });
    },
  });

  const approveTransactionMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { status: TransactionStatus.APPROVED | TransactionStatus.REJECTED; rejectionReason?: string };
    }) => transactionsApi.approve(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const handleApprove = (type: 'customer' | 'artist' | 'transaction', id: string) => {
    if (type === 'customer') {
      approveCustomerMutation.mutate({ id, data: { status: CustomerStatus.APPROVED } });
    } else if (type === 'artist') {
      approveArtistMutation.mutate({ id, data: { status: ArtistStatus.APPROVED } });
    } else {
      approveTransactionMutation.mutate({ id, data: { status: TransactionStatus.APPROVED } });
    }
  };

  const handleReject = (type: 'customer' | 'artist' | 'transaction', id: string) => {
    const reason = window.prompt(t('common.rejectReasonPromptApproval'));
    if (!reason) return;

    if (type === 'customer') {
      approveCustomerMutation.mutate({
        id,
        data: { status: CustomerStatus.REJECTED, rejectionReason: reason },
      });
    } else if (type === 'artist') {
      approveArtistMutation.mutate({
        id,
        data: { status: ArtistStatus.REJECTED, rejectionReason: reason },
      });
    } else {
      approveTransactionMutation.mutate({
        id,
        data: { status: TransactionStatus.REJECTED, rejectionReason: reason },
      });
    }
  };

  const pendingCustomers = customersData?.data || [];
  const pendingArtists = artists || [];
  const pendingTransactions =
    transactions?.filter((row) => row.status === TransactionStatus.PENDING) || [];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{t('approvals.title')}</h1>
      </div>

      <div className="card">
        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem' }}>
          {t('approvals.customersTitle', { count: pendingCustomers.length })}
        </h2>
        {pendingCustomers.length === 0 ? (
          <p className="ui-text-muted">{t('approvals.noPendingCustomers')}</p>
        ) : (
          <div className="table-container">
            <table className="table" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '20%' }} />
                <col style={{ width: '25%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '25%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>{t('common.name')}</th>
                  <th>{t('common.email')}</th>
                  <th>{t('common.writer')}</th>
                  <th>{t('common.createdAtCol')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {pendingCustomers.map((customer: Customer) => (
                  <tr key={customer.id}>
                    <td>
                      <Link to={`/customers/${customer.id}`} className="ui-link">
                        {customer.name}
                      </Link>
                    </td>
                    <td>{customer.email || '-'}</td>
                    <td>{customer.createdBy?.name || '-'}</td>
                    <td>{formatDate(customer.createdAt)}</td>
                    <td>
                      {canApprove ? (
                        <div className="button-group">
                          <button
                            type="button"
                            className="button button-primary"
                            onClick={() => handleApprove('customer', customer.id)}
                            disabled={approveCustomerMutation.isPending}
                          >
                            {t('common.approve')}
                          </button>
                          <button
                            type="button"
                            className="button button-danger"
                            onClick={() => handleReject('customer', customer.id)}
                            disabled={approveCustomerMutation.isPending}
                          >
                            {t('common.reject')}
                          </button>
                        </div>
                      ) : (
                        <span className="ui-text-muted" style={{ fontSize: '0.875rem' }}>
                          {t('common.noPermission')}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem' }}>
          {t('approvals.artistsTitle', { count: pendingArtists.length })}
        </h2>
        {pendingArtists.length === 0 ? (
          <p className="ui-text-muted">{t('approvals.noPendingArtists')}</p>
        ) : (
          <div className="table-container">
            <table className="table" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '20%' }} />
                <col style={{ width: '25%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '25%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>{t('common.name')}</th>
                  <th>{t('common.nationality')}</th>
                  <th>{t('common.genre')}</th>
                  <th>{t('common.createdAtCol')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {pendingArtists.map((artist: Artist) => (
                  <tr key={artist.id}>
                    <td>
                      <Link to={`/artists/${artist.id}`} className="ui-link">
                        {artist.name}
                      </Link>
                    </td>
                    <td>{artist.nationality || '-'}</td>
                    <td>{artist.genre || '-'}</td>
                    <td>{formatDate(artist.createdAt)}</td>
                    <td>
                      {canApprove ? (
                        <div className="button-group">
                          <button
                            type="button"
                            className="button button-primary"
                            onClick={() => handleApprove('artist', artist.id)}
                            disabled={approveArtistMutation.isPending}
                          >
                            {t('common.approve')}
                          </button>
                          <button
                            type="button"
                            className="button button-danger"
                            onClick={() => handleReject('artist', artist.id)}
                            disabled={approveArtistMutation.isPending}
                          >
                            {t('common.reject')}
                          </button>
                        </div>
                      ) : (
                        <span className="ui-text-muted" style={{ fontSize: '0.875rem' }}>
                          {t('common.noPermission')}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem' }}>
          {t('approvals.transactionsTitle', { count: pendingTransactions.length })}
        </h2>
        {pendingTransactions.length === 0 ? (
          <p className="ui-text-muted">{t('approvals.noPendingTransactions')}</p>
        ) : (
          <div className="table-container">
            <table className="table" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '15%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '20%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>{t('common.customer')}</th>
                  <th>{t('common.artist')}</th>
                  <th>{t('common.amount')}</th>
                  <th>{t('common.transactionDate')}</th>
                  <th>{t('common.createdAtCol')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {pendingTransactions.map((row: Transaction) => (
                  <tr key={row.id}>
                    <td>
                      <Link to={`/customers/${row.customerId}`} className="ui-link">
                        {row.isMasked ? '***' : row.customer.name}
                      </Link>
                    </td>
                    <td>
                      <Link to={`/artists/${row.artistId}`} className="ui-link">
                        {row.artist.name}
                      </Link>
                    </td>
                    <td>
                      {row.isMasked ? '***' : formatMoneyAmount(row.amount as number | string, row.currency)}
                    </td>
                    <td>{formatDate(row.transactionDate)}</td>
                    <td>{formatDate(row.createdAt)}</td>
                    <td>
                      {canApprove ? (
                        <div className="button-group">
                          <button
                            type="button"
                            className="button button-primary"
                            onClick={() => handleApprove('transaction', row.id)}
                            disabled={approveTransactionMutation.isPending}
                          >
                            {t('common.approve')}
                          </button>
                          <button
                            type="button"
                            className="button button-danger"
                            onClick={() => handleReject('transaction', row.id)}
                            disabled={approveTransactionMutation.isPending}
                          >
                            {t('common.reject')}
                          </button>
                        </div>
                      ) : (
                        <span className="ui-text-muted" style={{ fontSize: '0.875rem' }}>
                          {t('common.noPermission')}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
