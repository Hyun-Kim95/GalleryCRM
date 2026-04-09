import React, { useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { artistsApi, ArtistStatus } from '../api/artists.api';
import { formatDateTime } from '../utils/date';
import { useAuthStore } from '../store/authStore';
import { entityStatusBadgeStyle } from '../constants/uiColors';

export const ArtistDetail: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();

  const { data: artist, isLoading, error } = useQuery({
    queryKey: ['artist', id],
    queryFn: () => artistsApi.getById(id!),
    enabled: !!id,
  });

  const getStatusLabel = useCallback(
    (status: ArtistStatus): string => {
      switch (status) {
        case ArtistStatus.DRAFT:
          return t('status.draft');
        case ArtistStatus.PENDING:
          return t('status.pending');
        case ArtistStatus.APPROVED:
          return t('status.approved');
        case ArtistStatus.REJECTED:
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
          <h1 className="page-title">{t('artists.detailTitle')}</h1>
        </div>
        <div className="card">
          <p className="ui-empty">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">{t('artists.detailTitle')}</h1>
        </div>
        <div className="card">
          <div className="ui-alert-error">{t('artists.loadError')}</div>
        </div>
      </div>
    );
  }

  const canEdit =
    artist.createdById === user?.id ||
    user?.role === 'ADMIN' ||
    user?.role === 'MASTER' ||
    user?.role === 'MANAGER';

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{t('artists.detailTitle')}</h1>
        <div className="button-group">
          <Link to="/artists" className="button button-outline">
            {t('common.backToList')}
          </Link>
          {canEdit ? (
            <Link to={`/artists/${artist.id}/edit`} className="button button-primary">
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
              {artist.name}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('common.nationality')}</label>
            <div className="ui-field">
              {artist.nationality || '-'}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('common.genre')}</label>
            <div className="ui-field">
              {artist.genre || '-'}
            </div>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">{t('common.bio')}</label>
          <div className="ui-field ui-field--min-h" style={{ whiteSpace: 'pre-wrap' }}>
            {artist.bio || '-'}
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
                style={{ ...entityStatusBadgeStyle(artist.status), padding: '0.5rem 1rem' }}
              >
                {getStatusLabel(artist.status)}
              </span>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('common.writer')}</label>
            <div className="ui-field">
              {artist.createdBy?.name || '-'}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('common.approver')}</label>
            <div className="ui-field">
              {artist.approvedBy?.name || '-'}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('common.createdAtCol')}</label>
            <div className="ui-field">
              {formatDateTime(artist.createdAt)}
            </div>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t('common.approvedAt')}</label>
            <div className="ui-field">
              {artist.approvedAt ? formatDateTime(artist.approvedAt) : '-'}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('common.updatedAt')}</label>
            <div className="ui-field">
              {formatDateTime(artist.updatedAt)}
            </div>
          </div>
        </div>
        {artist.rejectionReason && (
          <div className="form-group">
            <label className="form-label">{t('common.rejectionReason')}</label>
            <div className="ui-rejection-field">{artist.rejectionReason}</div>
          </div>
        )}
      </div>
    </div>
  );
};
