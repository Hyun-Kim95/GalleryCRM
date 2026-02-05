import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { artistsApi, Artist, ArtistStatus } from '../api/artists.api';
import { formatDate } from '../utils/date';
import { useAuthStore } from '../store/authStore';

export const ArtistsList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: artists, isLoading, error } = useQuery({
    queryKey: ['artists'],
    queryFn: () => artistsApi.getAll(),
  });

  const getStatusLabel = (status: ArtistStatus): string => {
    switch (status) {
      case ArtistStatus.DRAFT:
        return '초안';
      case ArtistStatus.PENDING:
        return '대기';
      case ArtistStatus.APPROVED:
        return '승인';
      case ArtistStatus.REJECTED:
        return '반려';
      default:
        return status;
    }
  };

  const getStatusColor = (status: ArtistStatus): string => {
    switch (status) {
      case ArtistStatus.DRAFT:
        return '#95a5a6';
      case ArtistStatus.PENDING:
        return '#f39c12';
      case ArtistStatus.APPROVED:
        return '#27ae60';
      case ArtistStatus.REJECTED:
        return '#e74c3c';
      default:
        return '#34495e';
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">작가 목록</h1>
        <Link to="/artists/new" className="button button-primary">
          등록
        </Link>
      </div>

      {isLoading && (
        <div className="card">
          <p style={{ textAlign: 'center', padding: '2rem' }}>로딩 중...</p>
        </div>
      )}

      {error && (
        <div className="card">
          <div style={{ backgroundColor: '#fee', color: '#c33', padding: '1rem', borderRadius: '4px' }}>
            오류가 발생했습니다. 다시 시도해주세요.
          </div>
        </div>
      )}

      {artists && (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>국적</th>
                  <th>장르</th>
                  <th>상태</th>
                  <th>등록일</th>
                  <th>작업</th>
                </tr>
              </thead>
                <tbody>
                  {artists.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#95a5a6' }}>
                        작가 데이터가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    artists.map((artist: Artist) => {
                      const canEdit =
                        artist.createdById === user?.id ||
                        user?.role === 'ADMIN' ||
                        user?.role === 'MASTER' ||
                        user?.role === 'MANAGER';

                      return (
                        <tr
                          key={artist.id}
                          style={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/artists/${artist.id}`)}
                        >
                          <td>{artist.name}</td>
                          <td>{artist.nationality || '-'}</td>
                          <td>{artist.genre || '-'}</td>
                          <td>
                            <span
                              className="badge"
                              style={{
                                backgroundColor: getStatusColor(artist.status),
                                color: 'white',
                              }}
                            >
                              {getStatusLabel(artist.status)}
                            </span>
                          </td>
                          <td>{formatDate(artist.createdAt)}</td>
                          <td>
                            <div className="button-group" onClick={(e) => e.stopPropagation()}>
                              {canEdit && (
                                <button
                                  className="button button-outline"
                                  onClick={() => navigate(`/artists/${artist.id}/edit`)}
                                  style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}
                                >
                                  수정
                                </button>
                              )}
                            </div>
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
