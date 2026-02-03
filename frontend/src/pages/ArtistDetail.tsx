import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { artistsApi, Artist } from '../api/artists.api';
import { formatDateTime } from '../utils/date';

export const ArtistDetail = () => {
  const { id } = useParams<{ id: string }>();

  const { data: artist, isLoading, error } = useQuery<Artist | undefined>({
    queryKey: ['artist', id],
    queryFn: async () => {
      if (!id) return undefined;
      return artistsApi.getById(id);
    },
    enabled: !!id,
  });

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
    </div>
  );
};


