import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { getRoleLabel } from '../utils/role';
import { dashboardApi } from '../api/dashboard.api';

const getActionLabel = (action: string) => {
  const actionMap: Record<string, string> = {
    CREATE: '생성',
    UPDATE: '수정',
    DELETE: '삭제',
    VIEW: '조회',
    APPROVE: '승인',
    REJECT: '반려',
  };
  return actionMap[action] || action;
};

const getEntityTypeLabel = (entityType: string) => {
  const entityMap: Record<string, string> = {
    CUSTOMER: '고객',
    ARTIST: '작가',
    TRANSACTION: '거래',
    ACCESS_REQUEST: '열람 요청',
  };
  return entityMap[entityType] || entityType;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  return date.toLocaleDateString('ko-KR');
};

export const Dashboard = () => {
  const user = useAuthStore((state) => state.user);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats(),
  });

  return (
    <div>
      <h1 style={{ marginBottom: '10px' }}>대시보드</h1>
      <p style={{ color: '#7f8c8d', marginBottom: '30px' }}>
        환영합니다, <strong>{user?.name}</strong>님! ({getRoleLabel(user?.role || '')})
      </p>

      {/* 통계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div
          style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderLeft: '4px solid #3498db',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ margin: 0, color: '#7f8c8d', fontSize: '14px', fontWeight: 'normal' }}>총 고객 수</h3>
            <Link to="/customers" style={{ color: '#3498db', textDecoration: 'none', fontSize: '12px' }}>
              보기 →
            </Link>
          </div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#3498db' }}>
            {isLoading ? '...' : stats?.totalCustomers || 0}
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderLeft: '4px solid #f39c12',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ margin: 0, color: '#7f8c8d', fontSize: '14px', fontWeight: 'normal' }}>승인 대기 고객</h3>
            {(user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'MASTER') && (
              <Link to="/approvals" style={{ color: '#f39c12', textDecoration: 'none', fontSize: '12px' }}>
                처리 →
              </Link>
            )}
          </div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#f39c12' }}>
            {isLoading ? '...' : stats?.pendingCustomers || 0}
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderLeft: '4px solid #e74c3c',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ margin: 0, color: '#7f8c8d', fontSize: '14px', fontWeight: 'normal' }}>대기 중인 열람 요청</h3>
            <Link to="/access-requests" style={{ color: '#e74c3c', textDecoration: 'none', fontSize: '12px' }}>
              보기 →
            </Link>
          </div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#e74c3c' }}>
            {isLoading ? '...' : stats?.pendingAccessRequests || 0}
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderLeft: '4px solid #27ae60',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ margin: 0, color: '#7f8c8d', fontSize: '14px', fontWeight: 'normal' }}>최근 등록 작가 (7일)</h3>
            <Link to="/artists" style={{ color: '#27ae60', textDecoration: 'none', fontSize: '12px' }}>
              보기 →
            </Link>
          </div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#27ae60' }}>
            {isLoading ? '...' : stats?.recentArtists || 0}
          </div>
        </div>
      </div>

      {/* 최근 활동 및 사용자 정보 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* 최근 활동 */}
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0 }}>최근 활동</h2>
            <Link to="/audit-logs" style={{ color: '#3498db', textDecoration: 'none', fontSize: '14px' }}>
              전체 보기 →
            </Link>
          </div>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#7f8c8d' }}>로딩 중...</div>
          ) : stats?.recentActivities && stats.recentActivities.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stats.recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  style={{
                    padding: '12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    borderLeft: '3px solid #3498db',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{activity.userName}</strong>님이{' '}
                      <strong>{getEntityTypeLabel(activity.entityType)}</strong>을(를){' '}
                      <strong>{getActionLabel(activity.action)}</strong>했습니다
                    </div>
                    <span style={{ color: '#7f8c8d', fontSize: '12px' }}>{formatDate(activity.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: '#7f8c8d' }}>최근 활동이 없습니다</div>
          )}
        </div>

        {/* 사용자 정보 */}
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h2 style={{ marginTop: 0, marginBottom: '20px' }}>사용자 정보</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <strong style={{ color: '#7f8c8d', fontSize: '14px' }}>이름</strong>
              <div style={{ marginTop: '5px', fontSize: '16px' }}>{user?.name}</div>
            </div>
            <div>
              <strong style={{ color: '#7f8c8d', fontSize: '14px' }}>이메일</strong>
              <div style={{ marginTop: '5px', fontSize: '16px' }}>{user?.email}</div>
            </div>
            <div>
              <strong style={{ color: '#7f8c8d', fontSize: '14px' }}>역할</strong>
              <div style={{ marginTop: '5px', fontSize: '16px' }}>{getRoleLabel(user?.role || '')}</div>
            </div>
            <div>
              <strong style={{ color: '#7f8c8d', fontSize: '14px' }}>소속 팀</strong>
              <div style={{ marginTop: '5px', fontSize: '16px' }}>{user?.teamId || '없음'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

