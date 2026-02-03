import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { artistsApi, Artist, ArtistStatus } from '../api/artists.api';
import { formatDate } from '../utils/date';
import { useAuthStore } from '../store/authStore';

export const ArtistsList = () => {
  const user = useAuthStore((state) => state.user);
  const { data: artists, isLoading, error } = useQuery({
    queryKey: ['artists'],
    queryFn: () => artistsApi.getAll(),
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
        <h1 style={{ margin: 0 }}>작가 관리</h1>
        {user && (
          <Link
            to="/artists/new"
            style={{
              padding: '10px 20px',
              backgroundColor: '#3498db',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
            }}
          >
            + 새 작가 등록
          </Link>
        )}
      </div>

      {isLoading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>로딩 중...</div>
      )}
      {error && (
        <div
          style={{
            backgroundColor: '#e74c3c',
            color: 'white',
            padding: '15px',
            borderRadius: '4px',
            marginBottom: '20px',
          }}
        >
          작가 목록을 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.
        </div>
      )}

      {artists && (
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#34495e', color: 'white' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>이름</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>국적</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>장르</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>승인 상태</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>활성 상태</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>생성일</th>
              </tr>
            </thead>
            <tbody>
              {artists.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: '40px',
                      textAlign: 'center',
                      color: '#95a5a6',
                    }}
                  >
                    작가 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                artists.map((artist: Artist) => (
                  <tr
                    key={artist.id}
                    style={{
                      borderBottom: '1px solid #ecf0f1',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                  >
                    <td style={{ padding: '12px' }}>
                      <Link
                        to={`/artists/${artist.id}`}
                        style={{
                          color: '#3498db',
                          textDecoration: 'none',
                          fontWeight: 'bold',
                        }}
                      >
                        {artist.name}
                      </Link>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {artist.nationality || '-'}
                    </td>
                    <td style={{ padding: '12px' }}>{artist.genre || '-'}</td>
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: getStatusColor(artist.status),
                          color: 'white',
                        }}
                      >
                        {getStatusLabel(artist.status)}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: artist.isActive
                            ? '#27ae60'
                            : '#95a5a6',
                          color: 'white',
                        }}
                      >
                        {artist.isActive ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '12px',
                        fontSize: '14px',
                        color: '#7f8c8d',
                      }}
                    >
                      {formatDate(artist.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};


