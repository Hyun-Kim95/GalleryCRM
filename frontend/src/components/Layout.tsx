import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getRoleLabel } from '../utils/role';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  // 모바일에서 메뉴 클릭 시 자동으로 닫기
  const handleMenuClick = () => {
    setIsMobileMenuOpen(false);
    setIsSidebarOpen(false);
  };

  // 화면 크기 변경 감지
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsSidebarOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/', label: '대시보드', icon: '📊' },
    { path: '/customers', label: '고객 관리', icon: '👥' },
    { path: '/artists', label: '작가 관리', icon: '🎨' },
    { path: '/transactions', label: '거래 관리', icon: '💰' },
    { path: '/approvals', label: '승인 대기', icon: '✅' },
    { path: '/access-requests', label: '열람 요청', icon: '🔍' },
    { path: '/audit-logs', label: '활동 로그', icon: '📝' },
  ];

  // 관리자 전용 메뉴
  const adminMenuItems = [
    { path: '/admin/users', label: '사용자 관리', icon: '👤' },
    { path: '/teams', label: '팀 관리', icon: '👔' },
  ];

  const isAdmin = user?.role === 'MASTER' || user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER';
  const isStaff = user?.role === 'STAFF';
  const canManageUsers = isAdmin || isManager || isStaff; // 관리자, 팀장, 사원 모두 접근 가능

  return (
    <div className="layout">
      {/* 모바일 헤더 */}
      <header className="layout-header mobile-header">
        <button
          className="mobile-menu-button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="메뉴 열기"
        >
          <span className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
        <h1 className="layout-title">Gallery CRM</h1>
        <div className="header-user-info">
          <span className="user-name">{user?.name || '사용자'}</span>
        </div>
      </header>

      {/* 데스크톱 헤더 */}
      <header className="layout-header desktop-header">
        <h1 className="layout-title">Gallery CRM</h1>
        <div className="header-right">
          <div className="user-info">
            <span className="user-name">{user?.name || '사용자'}</span>
            <span className="user-role">{getRoleLabel(user?.role)}</span>
          </div>
          <button className="logout-button" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      </header>

      <div className="layout-container">
        {/* 모바일 사이드바 오버레이 */}
        {isMobileMenuOpen && (
          <div
            className="mobile-overlay"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* 사이드바 */}
        <aside className={`sidebar ${isSidebarOpen ? 'open' : ''} ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <div className="sidebar-header">
            <h2>메뉴</h2>
            <button
              className="sidebar-close-button"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="사이드바 닫기"
            >
              ×
            </button>
          </div>

          <nav className="sidebar-nav">
            <ul className="nav-list">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                    onClick={handleMenuClick}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </Link>
                </li>
              ))}
              {canManageUsers && (
                <>
                  <li className="nav-divider">
                    <span>관리</span>
                  </li>
                  {/* 사용자 관리 - 관리자와 팀장 모두 접근 가능 */}
                  <li>
                    <Link
                      to="/admin/users"
                      className={`nav-link ${location.pathname === '/admin/users' ? 'active' : ''}`}
                      onClick={handleMenuClick}
                    >
                      <span className="nav-icon">👤</span>
                      <span className="nav-label">사용자 관리</span>
                    </Link>
                  </li>
                  {/* 팀 관리 - 관리자만 접근 가능 */}
                  {isAdmin && (
                    <li>
                      <Link
                        to="/teams"
                        className={`nav-link ${location.pathname === '/teams' ? 'active' : ''}`}
                        onClick={handleMenuClick}
                      >
                        <span className="nav-icon">👔</span>
                        <span className="nav-label">팀 관리</span>
                      </Link>
                    </li>
                  )}
                </>
              )}
            </ul>
          </nav>

          <div className="sidebar-footer">
            <div className="sidebar-user-info">
              <div className="user-name">{user?.name || '사용자'}</div>
              <div className="user-role">{getRoleLabel(user?.role)}</div>
            </div>
            <button className="logout-button" onClick={handleLogout}>
              로그아웃
            </button>
          </div>
        </aside>

        {/* 메인 컨텐츠 */}
        <main className="layout-main">
          <div className="content-wrapper">{children}</div>
        </main>
      </div>
    </div>
  );
};
