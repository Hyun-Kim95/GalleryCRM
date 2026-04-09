import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { auditLogsApi, AuditLog, AuditAction, AuditEntityType } from '../api/audit-logs.api';
import { formatDateTime } from '../utils/date';
import { Link } from 'react-router-dom';
import { auditActionBadgeStyle } from '../constants/uiColors';

export const AuditLogsList = () => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<{
    entityType?: AuditEntityType;
    entityId?: string;
    limit: number;
  }>({
    limit: 100,
  });

  const { data: logs, isLoading, error } = useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () =>
      auditLogsApi.getAll({
        entityType: filters.entityType,
        entityId: filters.entityId,
        limit: filters.limit,
      }),
  });

  const getActionLabel = useCallback(
    (action: AuditAction): string => {
      const key = `audit.actionLabels.${action}`;
      const label = t(key);
      return label === key ? action : label;
    },
    [t]
  );

  const getEntityTypeLabel = useCallback(
    (type: AuditEntityType): string => {
      const key = `audit.entityLabels.${type}`;
      const label = t(key);
      return label === key ? type : label;
    },
    [t]
  );

  const getEntityLink = (type: AuditEntityType, id: string): string | null => {
    switch (type) {
      case AuditEntityType.CUSTOMER:
        return `/customers/${id}`;
      case AuditEntityType.ARTIST:
        return `/artists/${id}`;
      case AuditEntityType.TRANSACTION:
        return `/transactions/${id}`;
      case AuditEntityType.USER:
        return `/admin/users`;
      case AuditEntityType.TEAM:
        return `/teams`;
      default:
        return null;
    }
  };

  const getFieldLabel = useCallback(
    (key: string): string => {
      const k = `auditField.${key}`;
      const label = t(k);
      return label === k ? key : label;
    },
    [t]
  );

  const formatValue = useCallback(
    (key: string, value: any): string => {
      if (value === null || value === undefined) return '-';

      if (typeof value === 'string') {
        const upper = value.toUpperCase();
        if (upper === 'DRAFT') return t('status.draft');
        if (upper === 'PENDING') return t('status.pending');
        if (upper === 'APPROVED') return t('status.approved');
        if (upper === 'REJECTED') return t('status.rejected');

        if (key === 'approved' || key === 'isActive') {
          if (value === 'true' || value === '1') return t('common.yes');
          if (value === 'false' || value === '0') return t('common.no');
        }

        return value;
      }

      if (typeof value === 'boolean') {
        return value ? t('common.yes') : t('common.no');
      }

      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
      }
      return JSON.stringify(value);
    },
    [t]
  );

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
        }}
      >
        <h1 style={{ margin: 0 }}>{t('audit.title')}</h1>
      </div>

      <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
          }}
        >
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>
              {t('audit.filterEntityType')}
            </label>
            <select
              className="form-select"
              value={filters.entityType || ''}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  entityType: e.target.value ? (e.target.value as AuditEntityType) : undefined,
                }))
              }
              style={{ width: '100%' }}
            >
              <option value="">{t('common.all')}</option>
              <option value={AuditEntityType.CUSTOMER}>{t('audit.entityLabels.CUSTOMER')}</option>
              <option value={AuditEntityType.ARTIST}>{t('audit.entityLabels.ARTIST')}</option>
              <option value={AuditEntityType.USER}>{t('audit.entityLabels.USER')}</option>
              <option value={AuditEntityType.TEAM}>{t('audit.entityLabels.TEAM')}</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>
              {t('audit.entityId')}
            </label>
            <input
              type="text"
              className="form-input"
              placeholder={t('common.entityIdPlaceholder')}
              value={filters.entityId || ''}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  entityId: e.target.value.trim() || undefined,
                }))
              }
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>
              {t('audit.filterLimit')}
            </label>
            <select
              className="form-select"
              value={filters.limit}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  limit: parseInt(e.target.value, 10),
                }))
              }
              style={{ width: '100%' }}
            >
              <option value={50}>{t('common.limitCount', { n: 50 })}</option>
              <option value={100}>{t('common.limitCount', { n: 100 })}</option>
              <option value={200}>{t('common.limitCount', { n: 200 })}</option>
              <option value={500}>{t('common.limitCount', { n: 500 })}</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="ui-empty" style={{ padding: '40px' }}>
          {t('common.loading')}
        </div>
      )}
      {error && (
        <div className="ui-alert-error" style={{ marginBottom: '20px', padding: '15px' }}>
          {t('common.errorRetry')}
        </div>
      )}

      {logs && (
        <div className="card">
          <div className="table-container">
            <table className="audit-logs-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left' }}>{t('audit.time')}</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>{t('audit.user')}</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>{t('audit.action')}</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>{t('audit.entityType')}</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>{t('audit.entityId')}</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>{t('audit.detail')}</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="ui-empty" style={{ padding: '40px' }}>
                      {t('audit.empty')}
                    </td>
                  </tr>
                ) : (
                  logs.map((log: AuditLog) => {
                    const entityLink = getEntityLink(log.entityType, log.entityId);
                    return (
                      <tr key={log.id}>
                        <td className="ui-text-muted" style={{ padding: '12px', fontSize: '14px' }}>
                          {formatDateTime(log.createdAt)}
                        </td>
                        <td style={{ padding: '12px' }}>{log.user?.name || '-'}</td>
                        <td style={{ padding: '12px' }}>
                          <span
                            style={{
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              ...auditActionBadgeStyle(log.action),
                            }}
                          >
                            {getActionLabel(log.action)}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>{getEntityTypeLabel(log.entityType)}</td>
                        <td
                          className="ui-text-muted"
                          style={{
                            padding: '12px',
                            maxWidth: '220px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontSize: '12px',
                            fontFamily: 'var(--font-mono)',
                          }}
                          title={log.entityId}
                        >
                          {entityLink ? (
                            <Link to={entityLink} className="ui-link">
                              {log.entityId}
                            </Link>
                          ) : (
                            log.entityId
                          )}
                        </td>
                        <td className="ui-text-muted" style={{ padding: '12px', fontSize: '12px' }}>
                          {(() => {
                            if (
                              log.action === AuditAction.CREATE ||
                              log.action === AuditAction.UPDATE ||
                              log.action === AuditAction.APPROVE
                            ) {
                              return '-';
                            }

                            const newValue: any = log.newValue || {};
                            const reason: string | undefined =
                              newValue.reason || newValue.rejectionReason || newValue.rejection_reason;

                            if (reason) {
                              return <span>{reason}</span>;
                            }

                            if (log.newValue && Object.keys(log.newValue).length > 0) {
                              const entries = Object.entries(log.newValue);
                              return (
                                <details>
                                  <summary className="ui-link" style={{ cursor: 'pointer' }}>
                                    {t('common.detailView')}
                                  </summary>
                                  <div
                                    className="ui-field"
                                    style={{
                                      marginTop: '8px',
                                      padding: '8px',
                                      fontSize: '11px',
                                      maxWidth: '320px',
                                      maxHeight: '260px',
                                      overflow: 'auto',
                                    }}
                                  >
                                    {entries.map(([fk, value]) => {
                                      const label = getFieldLabel(fk);
                                      return (
                                        <div key={fk} style={{ marginBottom: '4px' }}>
                                          <span style={{ fontWeight: 600 }}>{label}</span>
                                          <span style={{ marginLeft: '4px' }}>{formatValue(fk, value)}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </details>
                              );
                            }

                            return '-';
                          })()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
