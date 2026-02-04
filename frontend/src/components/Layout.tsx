import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getRoleLabel } from '../utils/role';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: '250px',
          backgroundColor: '#2c3e50',
          color: 'white',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: '30px' }}>Prism CRM</h2>
        
        <nav style={{ flex: 1 }}>
          <Link
            to="/"
            style={{
              display: 'block',
              padding: '12px',
              marginBottom: '8px',
              color: isActive('/') ? '#3498db' : 'white',
              textDecoration: 'none',
              backgroundColor: isActive('/') ? '#34495e' : 'transparent',
              borderRadius: '4px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!isActive('/')) {
                e.currentTarget.style.backgroundColor = '#34495e';
                e.currentTarget.style.paddingLeft = '16px';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive('/')) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.paddingLeft = '12px';
              }
            }}
          >
            대시보드
          </Link>
          <Link
            to="/customers"
            style={{
              display: 'block',
              padding: '12px',
              marginBottom: '8px',
              color: isActive('/customers') ? '#3498db' : 'white',
              textDecoration: 'none',
              backgroundColor: isActive('/customers') ? '#34495e' : 'transparent',
              borderRadius: '4px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!isActive('/customers')) {
                e.currentTarget.style.backgroundColor = '#34495e';
                e.currentTarget.style.paddingLeft = '16px';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive('/customers')) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.paddingLeft = '12px';
              }
            }}
          >
            고객 관리
          </Link>
          <Link
            to="/artists"
            style={{
              display: 'block',
              padding: '12px',
              marginBottom: '8px',
              color: isActive('/artists') ? '#3498db' : 'white',
              textDecoration: 'none',
              backgroundColor: isActive('/artists') ? '#34495e' : 'transparent',
              borderRadius: '4px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!isActive('/artists')) {
                e.currentTarget.style.backgroundColor = '#34495e';
                e.currentTarget.style.paddingLeft = '16px';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive('/artists')) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.paddingLeft = '12px';
              }
            }}
          >
            작가 관리
          </Link>
          <Link
            to="/audit-logs"
            style={{
              display: 'block',
              padding: '12px',
              marginBottom: '8px',
              color: isActive('/audit-logs') ? '#3498db' : 'white',
              textDecoration: 'none',
              backgroundColor: isActive('/audit-logs') ? '#34495e' : 'transparent',
              borderRadius: '4px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!isActive('/audit-logs')) {
                e.currentTarget.style.backgroundColor = '#34495e';
                e.currentTarget.style.paddingLeft = '16px';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive('/audit-logs')) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.paddingLeft = '12px';
              }
            }}
          >
            활동 기록
          </Link>
          <Link
            to="/access-requests"
            style={{
              display: 'block',
              padding: '12px',
              marginBottom: '8px',
              color: isActive('/access-requests') ? '#3498db' : 'white',
              textDecoration: 'none',
              backgroundColor: isActive('/access-requests') ? '#34495e' : 'transparent',
              borderRadius: '4px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!isActive('/access-requests')) {
                e.currentTarget.style.backgroundColor = '#34495e';
                e.currentTarget.style.paddingLeft = '16px';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive('/access-requests')) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.paddingLeft = '12px';
              }
            }}
          >
            열람 요청
          </Link>
          <Link
            to="/teams"
            style={{
              display: 'block',
              padding: '12px',
              marginBottom: '8px',
              color: isActive('/teams') ? '#3498db' : 'white',
              textDecoration: 'none',
              backgroundColor: isActive('/teams') ? '#34495e' : 'transparent',
              borderRadius: '4px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!isActive('/teams')) {
                e.currentTarget.style.backgroundColor = '#34495e';
                e.currentTarget.style.paddingLeft = '16px';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive('/teams')) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.paddingLeft = '12px';
              }
            }}
          >
            팀 관리
          </Link>
          {(user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'MASTER') && (
            <Link
              to="/admin/users"
              style={{
                display: 'block',
                padding: '12px',
                marginBottom: '8px',
                color: isActive('/admin/users') ? '#3498db' : 'white',
                textDecoration: 'none',
                backgroundColor: isActive('/admin/users') ? '#34495e' : 'transparent',
                borderRadius: '4px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive('/admin/users')) {
                  e.currentTarget.style.backgroundColor = '#34495e';
                  e.currentTarget.style.paddingLeft = '16px';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive('/admin/users')) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.paddingLeft = '12px';
                }
              }}
            >
              사용자 관리
            </Link>
          )}
          {(user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'MASTER') && (
            <Link
              to="/approvals"
              style={{
                display: 'block',
                padding: '12px',
                marginBottom: '8px',
                color: isActive('/approvals') ? '#3498db' : 'white',
                textDecoration: 'none',
                backgroundColor: isActive('/approvals') ? '#34495e' : 'transparent',
                borderRadius: '4px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive('/approvals')) {
                  e.currentTarget.style.backgroundColor = '#34495e';
                  e.currentTarget.style.paddingLeft = '16px';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive('/approvals')) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.paddingLeft = '12px';
                }
              }}
            >
              승인 관리
            </Link>
          )}
        </nav>

        <div style={{ borderTop: '1px solid #34495e', paddingTop: '20px' }}>
          <div style={{ marginBottom: '10px', fontSize: '14px' }}>
            <div>{user?.name}</div>
            <div style={{ fontSize: '12px', color: '#95a5a6' }}>{getRoleLabel(user?.role)}</div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#c0392b';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#e74c3c';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            로그아웃
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '30px', backgroundColor: '#ecf0f1' }}>
        {children}
      </main>
    </div>
  );
};

