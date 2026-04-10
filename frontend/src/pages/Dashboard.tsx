import React, { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { customersApi } from '../api/customers.api';
import { artistsApi } from '../api/artists.api';
import { accessRequestsApi } from '../api/access-requests.api';

export const Dashboard: React.FC = () => {
  const { t } = useTranslation();

  const { data: customersData } = useQuery({
    queryKey: ['customers', 'dashboard'],
    queryFn: () => customersApi.search({ limit: 5, page: 1 }),
  });

  const { data: artists } = useQuery({
    queryKey: ['artists', 'dashboard'],
    queryFn: () => artistsApi.getAll(),
  });

  const { data: accessRequests } = useQuery({
    queryKey: ['access-requests', 'dashboard'],
    queryFn: () => accessRequestsApi.getAll(),
  });

  const pendingCustomers =
    customersData?.data.filter((c) => c.status === 'PENDING').length || 0;

  const pendingAccessRequests =
    accessRequests?.filter((r) => r.status === 'PENDING').length || 0;

  const getStatusLabel = useCallback(
    (status: string): string => {
      const map: Record<string, string> = {
        DRAFT: t('status.draft'),
        PENDING: t('status.pending'),
        APPROVED: t('status.approved'),
        REJECTED: t('status.rejected'),
        ACTIVE: t('dashboard.userActive'),
        INACTIVE: t('dashboard.userInactive'),
      };
      return map[status] || status;
    },
    [t]
  );

  return (
    <div>
      <h1 className="page-title">{t('dashboard.title')}</h1>

      <div className="grid grid-4" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <h3 className="ui-stat-label">{t('dashboard.totalCustomers')}</h3>
          <p className="ui-stat-value">{customersData?.total || 0}</p>
        </div>
        <div className="card">
          <h3 className="ui-stat-label">{t('dashboard.totalArtists')}</h3>
          <p className="ui-stat-value">{artists?.length || 0}</p>
        </div>
        <div className="card">
          <h3 className="ui-stat-label">{t('dashboard.pendingCustomers')}</h3>
          <p className="ui-stat-value ui-stat-value--pending">{pendingCustomers}</p>
        </div>
        <div className="card">
          <h3 className="ui-stat-label">{t('dashboard.accessRequests')}</h3>
          <p className="ui-stat-value ui-stat-value--accent">{pendingAccessRequests}</p>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="page-header" style={{ marginBottom: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{t('dashboard.recentCustomers')}</h2>
            <Link to="/customers" className="button button-outline" style={{ fontSize: '0.875rem' }}>
              {t('dashboard.seeAll')}
            </Link>
          </div>
          {customersData?.data.length === 0 ? (
            <p className="ui-text-muted">{t('dashboard.noCustomers')}</p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('common.name')}</th>
                    <th>{t('common.status')}</th>
                    <th>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {customersData?.data.slice(0, 5).map((customer) => (
                    <tr key={customer.id}>
                      <td>
                        <Link to={`/customers/${customer.id}`} className="ui-link">
                          {customer.name}
                        </Link>
                      </td>
                      <td>{getStatusLabel(customer.status)}</td>
                      <td>
                        <Link
                          to={`/customers/${customer.id}`}
                          className="button button-outline"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                        >
                          {t('common.view')}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="page-header" style={{ marginBottom: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{t('dashboard.quickLinks')}</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link to="/customers/new" className="button button-primary">
              {t('dashboard.registerCustomer')}
            </Link>
            <Link to="/artists/new" className="button button-primary">
              {t('dashboard.registerArtist')}
            </Link>
            <Link to="/approvals" className="button button-secondary">
              {t('dashboard.pendingList')}
            </Link>
            <Link to="/access-requests" className="button button-secondary">
              {t('dashboard.accessRequestList')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
