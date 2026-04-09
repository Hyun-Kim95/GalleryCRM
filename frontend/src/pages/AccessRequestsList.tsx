import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  accessRequestsApi,
  AccessRequest,
  AccessRequestStatus,
  AccessRequestTargetType,
} from '../api/access-requests.api';
import { formatDateTime } from '../utils/date';
import { useAuthStore } from '../store/authStore';
import { accessRequestBadgeStyle } from '../constants/uiColors';

export const AccessRequestsList: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [accessDuration, setAccessDuration] = useState(24);
  const { user } = useAuthStore();

  const canApprove = user?.role !== 'STAFF';

  const { data: requests, isLoading, error } = useQuery({
    queryKey: ['access-requests'],
    queryFn: () => accessRequestsApi.getAll(),
  });

  const approveMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        status: AccessRequestStatus.APPROVED | AccessRequestStatus.REJECTED;
        accessDurationHours?: number;
        rejectionReason?: string;
      };
    }) => accessRequestsApi.approve(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-requests'] });
    },
  });

  const handleApprove = (id: string) => {
    approveMutation.mutate({
      id,
      data: { status: AccessRequestStatus.APPROVED, accessDurationHours: accessDuration },
    });
  };

  const handleReject = (id: string) => {
    const reason = window.prompt(t('common.rejectReasonPrompt'));
    if (!reason) return;
    approveMutation.mutate({
      id,
      data: { status: AccessRequestStatus.REJECTED, rejectionReason: reason },
    });
  };

  const getStatusLabel = useCallback(
    (status: AccessRequestStatus): string => {
      switch (status) {
        case AccessRequestStatus.PENDING:
          return t('status.pending');
        case AccessRequestStatus.APPROVED:
          return t('status.approved');
        case AccessRequestStatus.REJECTED:
          return t('status.denied');
        default:
          return status;
      }
    },
    [t]
  );

  const getTargetTypeLabel = (type: AccessRequestTargetType | string): string => {
    switch (type) {
      case AccessRequestTargetType.CUSTOMER:
        return t('targetType.CUSTOMER');
      case AccessRequestTargetType.TRANSACTION:
        return t('targetType.TRANSACTION');
      default:
        return String(type);
    }
  };

  const pendingRequests = requests?.filter((r) => r.status === AccessRequestStatus.PENDING) || [];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{t('accessRequests.title')}</h1>
        {pendingRequests.length > 0 && canApprove && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label className="form-label" style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>
              {t('common.accessDurationLabel')}
            </label>
            <input
              type="number"
              min={1}
              max={168}
              value={accessDuration}
              onChange={(e) => setAccessDuration(Number(e.target.value))}
              className="form-input"
              style={{ width: '60px' }}
            />
            <span className="ui-text-muted" style={{ fontSize: '0.875rem' }}>
              {t('common.hours')}
            </span>
          </div>
        )}
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

      {requests && (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('accessRequests.requester')}</th>
                  <th>{t('accessRequests.targetType')}</th>
                  <th>{t('accessRequests.targetId')}</th>
                  <th>{t('common.reason')}</th>
                  <th>{t('common.status')}</th>
                  <th>{t('accessRequests.requestedAt')}</th>
                  <th>{t('accessRequests.expiresAt')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="ui-empty">
                      {t('accessRequests.empty')}
                    </td>
                  </tr>
                ) : (
                  requests.map((request: AccessRequest) => (
                    <tr key={request.id}>
                      <td>{request.requester?.name || '-'}</td>
                      <td>{getTargetTypeLabel(request.targetType)}</td>
                      <td>
                        {request.targetType === AccessRequestTargetType.CUSTOMER && (
                          <Link to={`/customers/${request.targetId}`} className="ui-link">
                            {request.targetId}
                          </Link>
                        )}
                        {request.targetType === AccessRequestTargetType.TRANSACTION && (
                          <Link to={`/transactions/${request.targetId}`} className="ui-link">
                            {request.targetId}
                          </Link>
                        )}
                        {request.targetType !== AccessRequestTargetType.CUSTOMER &&
                          request.targetType !== AccessRequestTargetType.TRANSACTION &&
                          request.targetId}
                      </td>
                      <td>{request.reason || '-'}</td>
                      <td>
                        <span className="badge" style={accessRequestBadgeStyle(request.status)}>
                          {getStatusLabel(request.status)}
                        </span>
                      </td>
                      <td>{formatDateTime(request.createdAt)}</td>
                      <td>{request.expiresAt ? formatDateTime(request.expiresAt) : '-'}</td>
                      <td>
                        {request.status === AccessRequestStatus.PENDING &&
                          (canApprove ? (
                            <div className="button-group">
                              <button
                                type="button"
                                className="button button-primary"
                                onClick={() => handleApprove(request.id)}
                                disabled={approveMutation.isPending}
                                style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}
                              >
                                {t('common.approve')}
                              </button>
                              <button
                                type="button"
                                className="button button-danger"
                                onClick={() => handleReject(request.id)}
                                disabled={approveMutation.isPending}
                                style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}
                              >
                                {t('common.deny')}
                              </button>
                            </div>
                          ) : (
                            <span className="ui-text-muted" style={{ fontSize: '0.875rem' }}>
                              {t('common.noPermission')}
                            </span>
                          ))}
                        {request.status === AccessRequestStatus.APPROVED && request.approvedBy && (
                          <span className="ui-text-muted" style={{ fontSize: '0.875rem' }}>
                            {t('common.approvedBy', { name: request.approvedBy.name })}
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
