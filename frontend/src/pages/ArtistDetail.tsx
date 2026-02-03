import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { artistsApi, Artist, ArtistStatus } from '../api/artists.api';
import { formatDateTime } from '../utils/date';
import { useAuthStore } from '../store/authStore';

export const ArtistDetail = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const { data: artist, isLoading, error } = useQuery<Artist | undefined>({
    queryKey: ['artist', id],
    queryFn: async () => {
      if (!id) return undefined;
      return artistsApi.getById(id);
    },
    enabled: !!id,
  });

  const submitMutation = useMutation({
    mutationFn: () => artistsApi.submitForApproval(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artist', id] });
      queryClient.invalidateQueries({ queryKey: ['artists'] });
      alert('승인 요청이 완료되었습니다.');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message ?? '승인 요청 중 오류가 발생했습니다.';
      alert(Array.isArray(msg) ? msg.join('\n') : msg);
    },
  });

  const getStatusColor = (status: ArtistStatus) => {
    switch (status) {
      case ArtistStatus.APPROVED:
        return '#27ae60';
      case ArtistStatus.PENDING:
        return '#f39c12';
      case ArtistStatus.REJECTED:
        return '#e74c3c';
      case ArtistStatus.DRAFT:
        return '#95a5a6';
      default:
        return '#34495e';
    }
  };

  const getStatusLabel = (status: ArtistStatus) => {
    switch (status) {
      case ArtistStatus.APPROVED:
        return '승인됨';
      case ArtistStatus.PENDING:
        return '대기중';
      case ArtistStatus.REJECTED:
        return '반려됨';
      case ArtistStatus.DRAFT:
        return '초안';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>로딩 중...</div>
    );
  }

  if (error || !artist) {
    return (
      <div>
        <div
          style={{
            backgroundColor: '#e74c3c',
            color: 'white',
            padding: '15px',
            borderRadius: '4px',
            marginBottom: '20px',
          }}
        >
          작가 정보를 불러올 수 없습니다.
        </div>
        <Link
          to="/artists"
          style={{ color: '#3498db', textDecoration: 'none' }}
        >
          ← 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const canSubmit =
    (artist.status === ArtistStatus.DRAFT || artist.status === ArtistStatus.REJECTED) &&
    !!user;

  const canEdit =
    (artist.status === ArtistStatus.DRAFT ||
      artist.status === ArtistStatus.APPROVED ||
      artist.status === ArtistStatus.REJECTED ||
      artist.status === ArtistStatus.PENDING) &&
    (artist.createdById === user?.id || 
     user?.role === 'ADMIN' || 
     user?.role === 'MASTER' || 
     user?.role === 'MANAGER');

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
        <div>
          <Link
            to="/artists"
            style={{
              color: '#3498db',
              textDecoration: 'none',
              marginBottom: '10px',
              display: 'block',
            }}
          >
            ← 목록으로 돌아가기
          </Link>
          <h1 style={{ margin: 0 }}>{artist.name}</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {canEdit && (
            <Link
              to={`/artists/${id}/edit`}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3498db',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '4px',
              }}
            >
              수정
            </Link>
          )}
          {canSubmit && (
            <button
              onClick={() => {
                if (window.confirm('이 작가 정보를 승인 요청하시겠습니까?')) {
                  submitMutation.mutate();
                }
              }}
              disabled={submitMutation.isPending}
              style={{
                padding: '10px 20px',
                backgroundColor: '#f39c12',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: submitMutation.isPending ? 'not-allowed' : 'pointer',
              }}
            >
              {submitMutation.isPending ? '처리 중...' : '승인 요청'}
            </button>
          )}
        </div>
      </div>

      <div
        style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: '20px',
          }}
        >
          <div
            style={{
              gridColumn: '1 / -1',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
            }}
          >
            <span
              style={{
                padding: '6px 16px',
                borderRadius: '16px',
                fontSize: '14px',
                fontWeight: 'bold',
                backgroundColor: getStatusColor(artist.status),
                color: 'white',
              }}
            >
              {getStatusLabel(artist.status)}
            </span>
          </div>
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '5px',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#7f8c8d',
              }}
            >
              이름
            </label>
            <div style={{ fontSize: '16px' }}>{artist.name}</div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '5px',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#7f8c8d',
              }}
            >
              국적
            </label>
            <div style={{ fontSize: '16px' }}>
              {artist.nationality || '-'}
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '5px',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#7f8c8d',
              }}
            >
              장르
            </label>
            <div style={{ fontSize: '16px' }}>{artist.genre || '-'}</div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '5px',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#7f8c8d',
              }}
            >
              상태
            </label>
            <div style={{ fontSize: '16px' }}>
              <span
                style={{
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  backgroundColor: artist.isActive ? '#27ae60' : '#95a5a6',
                  color: 'white',
                }}
              >
                {artist.isActive ? '활성' : '비활성'}
              </span>
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '5px',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#7f8c8d',
              }}
            >
              소개
            </label>
            <div style={{ fontSize: '16px', whiteSpace: 'pre-wrap' }}>
              {artist.bio || '-'}
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '5px',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#7f8c8d',
              }}
            >
              생성일시
            </label>
            <div style={{ fontSize: '14px', color: '#7f8c8d' }}>
              {formatDateTime(artist.createdAt)}
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '5px',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#7f8c8d',
              }}
            >
              수정일시
            </label>
            <div style={{ fontSize: '14px', color: '#7f8c8d' }}>
              {formatDateTime(artist.updatedAt)}
            </div>
          </div>
        </div>
      </div>

      {(artist.status === ArtistStatus.APPROVED || artist.status === ArtistStatus.REJECTED) && (
        <div
          style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '20px',
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: '20px' }}>
            {artist.status === ArtistStatus.APPROVED ? '승인 정보' : '반려 정보'}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#7f8c8d',
                }}
              >
                {artist.status === ArtistStatus.APPROVED ? '승인자' : '반려 처리자'}
              </label>
              <div style={{ fontSize: '16px' }}>{artist.approvedBy?.name || '-'}</div>
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#7f8c8d',
                }}
              >
                {artist.status === ArtistStatus.APPROVED ? '승인일시' : '반려일시'}
              </label>
              <div style={{ fontSize: '16px' }}>{formatDateTime(artist.approvedAt)}</div>
            </div>
            {artist.status === ArtistStatus.REJECTED && artist.rejectionReason && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '5px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#7f8c8d',
                  }}
                >
                  반려 사유
                </label>
                <div style={{ fontSize: '16px', color: '#e74c3c' }}>{artist.rejectionReason}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


