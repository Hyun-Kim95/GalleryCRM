import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { artistsApi, Artist, ArtistStatus } from '../api/artists.api';
import { formatDate } from '../utils/date';
import { entityStatusBadgeStyle } from '../constants/uiColors';

export const ArtistsList: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    status: '' as ArtistStatus | '',
    page: 1,
    limit: 15,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['artists', searchParams],
    queryFn: () =>
      artistsApi.search({
        ...searchParams,
        status: searchParams.status || undefined,
        keyword: searchParams.keyword || undefined,
      }),
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{t('artists.title')}</h1>
        <Link to="/artists/new" className="button button-primary">
          {t('common.register')}
        </Link>
      </div>

      <div className="card">
        <form onSubmit={handleSearch} className="search-filter-container">
          <input
            type="text"
            className="search-input"
            placeholder={t('artists.searchPlaceholder')}
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
                status: e.target.value as ArtistStatus | '',
                page: 1,
              }))
            }
            style={{ minWidth: '150px' }}
          >
            <option value="">{t('common.allStatuses')}</option>
            <option value={ArtistStatus.DRAFT}>{t('status.draft')}</option>
            <option value={ArtistStatus.PENDING}>{t('status.pending')}</option>
            <option value={ArtistStatus.APPROVED}>{t('status.approved')}</option>
            <option value={ArtistStatus.REJECTED}>{t('status.rejected')}</option>
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
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('common.name')}</th>
                    <th>{t('common.nationality')}</th>
                    <th>{t('common.genre')}</th>
                    <th>{t('common.status')}</th>
                    <th>{t('common.createdAtCol')}</th>
                    <th>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="ui-empty">
                        {t('artists.empty')}
                      </td>
                    </tr>
                  ) : (
                    data.data.map((artist: Artist) => (
                      <tr
                        key={artist.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/artists/${artist.id}`)}
                      >
                        <td>{artist.name}</td>
                        <td>{artist.nationality || '-'}</td>
                        <td>{artist.genre || '-'}</td>
                        <td>
                          <span className="badge" style={entityStatusBadgeStyle(artist.status)}>
                            {getStatusLabel(artist.status)}
                          </span>
                        </td>
                        <td>{formatDate(artist.createdAt)}</td>
                        <td>
                          <Link
                            to={`/artists/${artist.id}/edit`}
                            className="button button-outline"
                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {t('common.edit')}
                          </Link>
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
