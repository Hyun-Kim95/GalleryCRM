import React, { useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { customersApi, CustomerStatus } from '../api/customers.api';
import { formatDateTime } from '../utils/date';
import { useAuthStore } from '../store/authStore';
import { entityStatusBadgeStyle } from '../constants/uiColors';

export const CustomerDetail: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();

  const { data: customer, isLoading, error } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customersApi.getById(id!),
    enabled: !!id,
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

  if (isLoading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">{t('customers.detailTitle')}</h1>
        </div>
        <div className="card">
          <p className="ui-empty">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">{t('customers.detailTitle')}</h1>
        </div>
        <div className="card">
          <div className="ui-alert-error">{t('customers.loadError')}</div>
        </div>
      </div>
    );
  }

  const isCreator =
    customer.createdById === user?.id || customer.createdBy?.id === user?.id;
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MASTER';

  const canEdit =
    isAdmin ||
    (isCreator &&
      (customer.status === CustomerStatus.DRAFT ||
        customer.status === CustomerStatus.PENDING ||
        customer.status === CustomerStatus.REJECTED));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{t('customers.detailTitle')}</h1>
        <div className="button-group">
          <Link to="/customers" className="button button-outline">
            {t('common.backToList')}
          </Link>
          {canEdit ? (
            <Link to={`/customers/${customer.id}/edit`} className="button button-primary">
              {t('common.edit')}
            </Link>
          ) : null}
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>{t('common.basicInfo')}</h2>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t('common.name')}</label>
            <div className="ui-field">
              {customer.isMasked ? '***' : customer.name}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('common.email')}</label>
            <div className="ui-field">
              {customer.isMasked ? '***' : customer.email || '-'}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('common.phone')}</label>
            <div className="ui-field">
              {customer.isMasked ? '***' : customer.phone || '-'}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('common.address')}</label>
            <div className="ui-field">
              {customer.isMasked ? '***' : customer.address || '-'}
            </div>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">{t('common.notes')}</label>
          <div className="ui-field ui-field--min-h">
            {customer.isMasked ? '***' : customer.notes || '-'}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>{t('common.statusInfo')}</h2>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t('common.status')}</label>
            <div style={{ padding: '0.75rem' }}>
              <span
                className="badge"
                style={{ ...entityStatusBadgeStyle(customer.status), padding: '0.5rem 1rem' }}
              >
                {getStatusLabel(customer.status)}
              </span>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('common.assignedTeam')}</label>
            <div className="ui-field">
              {customer.team?.name || t('common.noTeam')}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('common.writer')}</label>
            <div className="ui-field">
              {customer.createdBy?.name || '-'}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('common.approver')}</label>
            <div className="ui-field">
              {customer.approvedBy?.name || '-'}
            </div>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t('common.createdAtCol')}</label>
            <div className="ui-field">
              {formatDateTime(customer.createdAt)}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('common.approvedAt')}</label>
            <div className="ui-field">
              {customer.approvedAt ? formatDateTime(customer.approvedAt) : '-'}
            </div>
          </div>
        </div>
        {customer.rejectionReason && (
          <div className="form-group">
            <label className="form-label">{t('common.rejectionReason')}</label>
            <div className="ui-rejection-field">{customer.rejectionReason}</div>
          </div>
        )}
      </div>
    </div>
  );
};
