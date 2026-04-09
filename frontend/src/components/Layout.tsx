import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { getRoleLabel } from '../utils/role';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const menuItems = useMemo(
    () => [
      { path: '/', labelKey: 'layout.nav.dashboard', icon: '📊' },
      { path: '/customers', labelKey: 'layout.nav.customers', icon: '👥' },
      { path: '/artists', labelKey: 'layout.nav.artists', icon: '🎨' },
      { path: '/transactions', labelKey: 'layout.nav.transactions', icon: '💰' },
      { path: '/approvals', labelKey: 'layout.nav.approvals', icon: '✅' },
      { path: '/access-requests', labelKey: 'layout.nav.accessRequests', icon: '🔍' },
      { path: '/audit-logs', labelKey: 'layout.nav.auditLogs', icon: '📝' },
    ],
    []
  );

  const handleMenuClick = () => {
    setIsMobileMenuOpen(false);
    setIsSidebarOpen(false);
  };

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

  const isAdmin = user?.role === 'MASTER' || user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER';
  const isStaff = user?.role === 'STAFF';
  const canManageUsers = isAdmin || isManager || isStaff;

  return (
    <div className="layout">
      <header className="layout-header mobile-header">
        <button
          className="mobile-menu-button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={t('layout.openMenu')}
          type="button"
        >
          <span className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
        <h1 className="layout-title">{t('app.title')}</h1>
        <div className="header-tools header-user-info">
          <span className="user-name">{user?.name || t('layout.user')}</span>
        </div>
      </header>

      <header className="layout-header desktop-header">
        <h1 className="layout-title">{t('app.title')}</h1>
        <div className="header-right header-tools">
          <div className="user-info">
            <span className="user-name">{user?.name || t('layout.user')}</span>
            <span className="user-role">{getRoleLabel(user?.role, t)}</span>
          </div>
          <button className="logout-button" onClick={handleLogout} type="button">
            {t('layout.logout')}
          </button>
        </div>
      </header>

      <div className="layout-container">
        {isMobileMenuOpen && (
          <div
            className="mobile-overlay"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        <aside className={`sidebar ${isSidebarOpen ? 'open' : ''} ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <div className="sidebar-header">
            <h2>{t('layout.menu')}</h2>
            <button
              className="sidebar-close-button"
              onClick={() => setIsSidebarOpen(false)}
              aria-label={t('layout.closeSidebar')}
              type="button"
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
                    <span className="nav-label">{t(item.labelKey)}</span>
                  </Link>
                </li>
              ))}
              {canManageUsers && (
                <>
                  <li className="nav-divider">
                    <span>{t('layout.adminSection')}</span>
                  </li>
                  <li>
                    <Link
                      to="/admin/users"
                      className={`nav-link ${location.pathname === '/admin/users' ? 'active' : ''}`}
                      onClick={handleMenuClick}
                    >
                      <span className="nav-icon">👤</span>
                      <span className="nav-label">{t('layout.nav.users')}</span>
                    </Link>
                  </li>
                  {isAdmin && (
                    <li>
                      <Link
                        to="/teams"
                        className={`nav-link ${location.pathname === '/teams' ? 'active' : ''}`}
                        onClick={handleMenuClick}
                      >
                        <span className="nav-icon">👔</span>
                        <span className="nav-label">{t('layout.nav.teams')}</span>
                      </Link>
                    </li>
                  )}
                </>
              )}
            </ul>
          </nav>

          <div className="sidebar-footer">
            <div className="sidebar-footer-settings">
              <ThemeToggle />
              <LanguageSwitcher />
            </div>
            <div className="sidebar-footer-mobile-only">
              <div className="sidebar-user-info">
                <div className="user-name">{user?.name || t('layout.user')}</div>
                <div className="user-role">{getRoleLabel(user?.role, t)}</div>
              </div>
              <button className="logout-button logout-button--block" onClick={handleLogout} type="button">
                {t('layout.logout')}
              </button>
            </div>
          </div>
        </aside>

        <main className="layout-main">
          <div className="content-wrapper">{children}</div>
        </main>
      </div>
    </div>
  );
};
