import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { artistsApi, Artist, ArtistStatus } from '../api/artists.api';
import { formatDateTime } from '../utils/date';
import { useAuthStore } from '../store/authStore';

export const ArtistDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();

  const { data: artist, isLoading, error } = useQuery({
    queryKey: ['artist', id],
    queryFn: () => artistsApi.getById(id!),
    enabled: !!id,
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

  if (isLoading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">작가 상세</h1>
        </div>
        <div className="card">
          <p style={{ textAlign: 'center', padding: '2rem' }}>로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">작가 상세</h1>
        </div>
        <div className="card">
          <div style={{ backgroundColor: '#fee', color: '#c33', padding: '1rem', borderRadius: '4px' }}>
            작가 정보를 불러올 수 없습니다.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">작가 상세</h1>
        <div className="button-group">
          <Link to="/artists" className="button button-outline">
            목록으로
          </Link>
          {(() => {
            // 수정 가능 조건: 작성자이거나 관리자/팀장
            const canEdit =
              artist.createdById === user?.id ||
              user?.role === 'ADMIN' ||
              user?.role === 'MASTER' ||
              user?.role === 'MANAGER';
            return canEdit ? (
              <Link to={`/artists/${artist.id}/edit`} className="button button-primary">
                수정
              </Link>
            ) : null;
          })()}
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>기본 정보</h2>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">이름</label>
            <div style={{ padding: '0.75rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              {artist.name}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">국적</label>
            <div style={{ padding: '0.75rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              {artist.nationality || '-'}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">장르</label>
            <div style={{ padding: '0.75rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              {artist.genre || '-'}
            </div>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">소개</label>
          <div style={{ padding: '0.75rem', backgroundColor: '#f5f5f5', borderRadius: '4px', minHeight: '100px', whiteSpace: 'pre-wrap' }}>
            {artist.bio || '-'}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>상태 정보</h2>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">상태</label>
            <div style={{ padding: '0.75rem', borderRadius: '4px' }}>
              <span
                className="badge"
                style={{
                  backgroundColor: getStatusColor(artist.status),
                  color: 'white',
                  padding: '0.5rem 1rem',
                }}
              >
                {getStatusLabel(artist.status)}
              </span>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">작성자</label>
            <div style={{ padding: '0.75rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              {artist.createdBy?.name || '-'}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">승인자</label>
            <div style={{ padding: '0.75rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              {artist.approvedBy?.name || '-'}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">등록일</label>
            <div style={{ padding: '0.75rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              {formatDateTime(artist.createdAt)}
            </div>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">승인일</label>
            <div style={{ padding: '0.75rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              {artist.approvedAt ? formatDateTime(artist.approvedAt) : '-'}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">수정일</label>
            <div style={{ padding: '0.75rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              {formatDateTime(artist.updatedAt)}
            </div>
          </div>
        </div>
        {artist.rejectionReason && (
          <div className="form-group">
            <label className="form-label">반려 사유</label>
            <div style={{ padding: '0.75rem', backgroundColor: '#fee', borderRadius: '4px' }}>
              {artist.rejectionReason}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
