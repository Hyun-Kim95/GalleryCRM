import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { customersApi, Customer, CustomerStatus } from '../api/customers.api';
import { accessRequestsApi, AccessRequestTargetType } from '../api/access-requests.api';
import { formatDate } from '../utils/date';
import { entityStatusBadgeStyle } from '../constants/uiColors';

export const CustomersList: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    status: '' as CustomerStatus | '',
    page: 1,
    limit: 20,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['customers', searchParams],
    queryFn: () =>
      customersApi.search({
        ...searchParams,
        status: searchParams.status || undefined,
        keyword: searchParams.keyword || undefined,
      }),
  });

  const createAccessRequestMutation = useMutation({
    mutationFn: ({ customerId, reason }: { customerId: string; reason?: string }) =>
      accessRequestsApi.create({
        targetType: AccessRequestTargetType.CUSTOMER,
        targetId: customerId,
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
    (status: CustomerStatus): string => {
      switch (status) {
        case CustomerStatus.DRAFT:
          return t('status.draft');
        case CustomerStatus.PENDING:
          return t('status.pending');
        case CustomerStatus.APPROVED:
          return t('status.approved');
        case CustomerStatus.REJECTED:
          return t('status.rejected');
        default:
          return status;
      }
    },
    [t]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{t('customers.title')}</h1>
        <Link to="/customers/new" className="button button-primary">
          {t('common.register')}
        </Link>
      </div>

      <div className="card">
        <form onSubmit={handleSearch} className="search-filter-container">
          <input
            type="text"
            className="search-input"
            placeholder={t('customers.searchPlaceholder')}
            value={searchParams.keyword}
            onChange={(e) =>
              setSearchParams((prev) => ({ ...prev, keyword: e.target.value, page: 1 }))
            }
          />
          <select
            className="form-select"
            value={searchParams.status}
            onChange={(e) =>
              setSearchParams((prev) => ({
                ...prev,
                status: e.target.value as CustomerStatus | '',
                page: 1,
              }))
            }
            style={{ minWidth: '150px' }}
          >
            <option value="">{t('common.allStatuses')}</option>
            <option value={CustomerStatus.DRAFT}>{t('status.draft')}</option>
            <option value={CustomerStatus.PENDING}>{t('status.pending')}</option>
            <option value={CustomerStatus.APPROVED}>{t('status.approved')}</option>
            <option value={CustomerStatus.REJECTED}>{t('status.rejected')}</option>
          </select>
          <button type="submit" className="button button-primary">
            {t('common.search')}
          </button>
        </form>
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

      {data && (
        <>
          <div className="card">
            {data.data.some((c) => c.isMasked) && (
              <div className="ui-mask-hint" style={{ marginBottom: '0.75rem', fontSize: '0.8rem' }}>
                {t('common.maskHintCustomer')}
              </div>
            )}
            <div className="table-container">
              <table className="table table-customers">
                <thead>
                  <tr>
                    <th>{t('common.name')}</th>
                    <th>{t('common.email')}</th>
                    <th>{t('common.phone')}</th>
                    <th className="col-team">{t('common.team')}</th>
                    <th>{t('common.status')}</th>
                    <th className="col-created-at">{t('common.createdAtCol')}</th>
                    <th>{t('common.writer')}</th>
                    <th>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="ui-empty">
                        {t('customers.empty')}
                      </td>
                    </tr>
                  ) : (
                    data.data.map((customer: Customer) => (
                      <tr
                        key={customer.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/customers/${customer.id}`)}
                      >
                        <td>{customer.isMasked ? '***' : customer.name}</td>
                        <td>{customer.isMasked ? '***' : customer.email || '-'}</td>
                        <td>{customer.isMasked ? '***' : customer.phone || '-'}</td>
                        <td className="col-team">{customer.team?.name || '-'}</td>
                        <td>
                          <span
                            className="badge"
                            style={entityStatusBadgeStyle(customer.status)}
                          >
                            {getStatusLabel(customer.status)}
                          </span>
                        </td>
                        <td className="col-created-at">{formatDate(customer.createdAt)}</td>
                        <td>{customer.createdBy?.name || '-'}</td>
                        <td>
                          {customer.isMasked ? (
                            <button
                              className="button button-outline"
                              style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                const reason = window.prompt(t('common.accessReasonPrompt'));
                                createAccessRequestMutation.mutate({
                                  customerId: customer.id,
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

          {data.totalPages > 1 && (
            <div className="pagination">
              <button
                className="button button-outline"
                onClick={() => setSearchParams((prev) => ({ ...prev, page: prev.page - 1 }))}
                disabled={searchParams.page === 1}
                type="button"
              >
                {t('common.prev')}
              </button>
              <span style={{ padding: '0 1rem' }}>
                {t('common.pageOf', {
                  current: searchParams.page,
                  total: data.totalPages,
                  count: data.total,
                })}
              </span>
              <button
                className="button button-outline"
                onClick={() => setSearchParams((prev) => ({ ...prev, page: prev.page + 1 }))}
                disabled={searchParams.page >= data.totalPages}
                type="button"
              >
                {t('common.next')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
