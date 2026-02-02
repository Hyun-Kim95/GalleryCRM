import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const Dashboard = () => {
  const user = useAuthStore((state) => state.user);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return '관리자';
      case 'MANAGER':
        return '팀장';
      case 'STAFF':
        return '사원';
      default:
        return role;
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '10px' }}>대시보드</h1>
      <p style={{ color: '#7f8c8d', marginBottom: '30px' }}>
        환영합니다, <strong>{user?.name}</strong>님! ({getRoleLabel(user?.role || '')})
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <Link
          to="/customers"
          style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            textDecoration: 'none',
            color: 'inherit',
            display: 'block',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
          }}
        >
          <h2 style={{ marginTop: 0, color: '#3498db' }}>고객 관리</h2>
          <p style={{ color: '#7f8c8d', margin: 0 }}>고객 정보 조회 및 관리</p>
        </Link>

        <Link
          to="/transactions"
          style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            textDecoration: 'none',
            color: 'inherit',
            display: 'block',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
          }}
        >
          <h2 style={{ marginTop: 0, color: '#27ae60' }}>거래 관리</h2>
          <p style={{ color: '#7f8c8d', margin: 0 }}>거래 정보 조회 및 관리</p>
        </Link>

        <Link
          to="/access-requests"
          style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            textDecoration: 'none',
            color: 'inherit',
            display: 'block',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
          }}
        >
          <h2 style={{ marginTop: 0, color: '#f39c12' }}>열람 요청</h2>
          <p style={{ color: '#7f8c8d', margin: 0 }}>데이터 열람 요청 관리</p>
        </Link>

        {(user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'MASTER') && (
          <Link
            to="/approvals"
            style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              textDecoration: 'none',
              color: 'inherit',
              display: 'block',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            }}
          >
            <h2 style={{ marginTop: 0, color: '#e74c3c' }}>승인 대시보드</h2>
            <p style={{ color: '#7f8c8d', margin: 0 }}>승인 대기 항목 관리</p>
          </Link>
        )}
      </div>

      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginTop: 0 }}>시스템 정보</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
          <div>
            <strong style={{ color: '#7f8c8d' }}>사용자 이름:</strong>
            <div style={{ marginTop: '5px', fontSize: '18px' }}>{user?.name}</div>
          </div>
          <div>
            <strong style={{ color: '#7f8c8d' }}>이메일:</strong>
            <div style={{ marginTop: '5px', fontSize: '18px' }}>{user?.email}</div>
          </div>
          <div>
            <strong style={{ color: '#7f8c8d' }}>역할:</strong>
            <div style={{ marginTop: '5px', fontSize: '18px' }}>{getRoleLabel(user?.role || '')}</div>
          </div>
          <div>
            <strong style={{ color: '#7f8c8d' }}>소속 팀:</strong>
            <div style={{ marginTop: '5px', fontSize: '18px' }}>{user?.teamId || '없음'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

