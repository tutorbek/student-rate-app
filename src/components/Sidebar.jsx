import React from 'react';

const IconSun = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const IconMoon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const IconUser = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconSettings = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const IconLogout = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const Sidebar = ({ activeTab, setActiveTab, userRole, onLogout, theme, toggleTheme, teacherProfile }) => {

  const displayName = userRole === 'admin'
    ? 'Administrator'
    : (teacherProfile?.fullName?.trim() || 'Ustoz');

  const displayTitle = userRole === 'admin'
    ? 'Tizim Boshqaruvi'
    : (teacherProfile?.title?.trim() || 'O\'qituvchi');

  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return 'BU';
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const renderUserAvatar = () => {
    const avatar = teacherProfile?.avatar;
    if (avatar && (avatar.startsWith('http') || avatar.startsWith('data:') || avatar.startsWith('/'))) {
      return (
        <img
          src={avatar}
          alt={displayName}
          className="user-card-avatar-img"
        />
      );
    }
    return (
      <div className="user-card-avatar-initials">
        {getInitials(displayName)}
      </div>
    );
  };

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      ),
    },
    {
      id: 'schedule',
      label: 'Dars Jadvalim',
      shortLabel: 'Jadval',
      icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    {
      id: 'leads',
      label: 'Lidlar',
      shortLabel: 'Lidlar',
      icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="19" y1="8" x2="19" y2="14" />
          <line x1="22" y1="11" x2="16" y2="11" />
        </svg>
      ),
    },
    {
      id: 'finance',
      label: 'Kassa',
      shortLabel: 'Kassa',
      icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
          <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
          <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
        </svg>
      ),
    },
    {
      id: 'groups',
      label: 'Guruhlar',
      icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      id: 'attendance',
      label: 'Davomat',
      icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      ),
    },
    {
      id: 'leaderboard',
      label: 'Reyting',
      icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
          <path d="M12 2a4 4 0 0 1 4 4v7a4 4 0 0 1-4 4 4 4 0 0 1-4-4V6a4 4 0 0 1 4-4Z" />
        </svg>
      ),
    },
  ];

  const filteredMenuItems = menuItems.filter((item) => {
    if (userRole === 'student') {
      return item.id === 'leaderboard';
    }
    if (userRole === 'admin') {
      return item.id === 'dashboard' || item.id === 'leads' || item.id === 'finance' || item.id === 'attendance';
    }
    return item.id !== 'dashboard' && item.id !== 'finance' && item.id !== 'leads';
  });

  const hasSettings = filteredMenuItems.some((item) => item.id === 'settings');

  return (
    <>
      {/* Desktop Left Sidebar: Compact, Apple Minimalist with Centered Navigation & Magnification */}
      <aside className="app-sidebar" aria-label="Chap navigatsiya">
        {/* Brand Header */}
        <div className="sidebar-header">
          <div
            className="sidebar-brand scale-active"
            onClick={() => setActiveTab(userRole === 'student' ? 'leaderboard' : (userRole === 'admin' ? 'dashboard' : 'schedule'))}
            title="Bosh sahifa"
          >
            <h1 className="sidebar-logo-text">
              EPCHIL <span className="logo-badge">ROBOT</span>
            </h1>
          </div>
          {toggleTheme && (
            <button
              type="button"
              className="sidebar-theme-btn scale-active"
              onClick={toggleTheme}
              aria-label="Mavzuni o'zgartirish"
              title={theme === 'dark' ? "Yorug' rejim" : "Qorong'i rejim"}
            >
              {theme === 'dark' ? <IconSun size={15} /> : <IconMoon size={15} />}
            </button>
          )}
        </div>

        {/* Top Navigation Group (directly below logo) */}
        <div className="sidebar-nav-top-wrap">
          <nav
            className="sidebar-nav-list"
            aria-label="Asosiy menyu"
          >
            {filteredMenuItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`sidebar-nav-btn scale-active ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}

            {userRole === 'admin' && onLogout && (
              <>
                <div className="sidebar-nav-divider" />
                <button
                  type="button"
                  className="sidebar-logout-btn scale-active"
                  onClick={onLogout}
                  title="Tizimdan chiqish"
                >
                  <span className="nav-icon"><IconLogout size={18} /></span>
                  <span className="nav-label">Chiqish</span>
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Bottom User / Teacher Profile Card (replaces separate Profil button) */}
        <div className="sidebar-bottom-section">
          <div className="sidebar-user-card">
            <div className="user-card-header">
              <span className="user-card-role-label">
                {userRole === 'admin' ? 'ADMINISTRATOR' : "O'QITUVCHI"}
              </span>
              <div className="user-card-actions">
                <button
                  type="button"
                  className={`user-card-action-btn scale-active ${activeTab === 'settings' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab('settings');
                  }}
                  title="Profil va Sozlamalar"
                  aria-label="Sozlamalar"
                >
                  <IconSettings size={14} />
                </button>
              </div>
            </div>

            <div
              className="user-card-body scale-active"
              onClick={() => setActiveTab('settings')}
              title="Profil sahifasiga o'tish"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveTab('settings');
                }
              }}
            >
              {renderUserAvatar()}
              <div className="user-card-details">
                <span className="user-card-name" title={displayName}>
                  {displayName}
                </span>
                <span className="user-card-sub" title={displayTitle}>
                  {displayTitle}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header (<= 900px) */}
      <header className="mobile-top-header">
        <div
          className="mobile-brand scale-active"
          onClick={() => setActiveTab(userRole === 'student' ? 'leaderboard' : (userRole === 'admin' ? 'dashboard' : 'schedule'))}
        >
          <h1 className="sidebar-logo-text">
            EPCHIL <span className="logo-badge">ROBOT</span>
          </h1>
        </div>

        <div className="mobile-header-actions">
          {toggleTheme && (
            <button
              type="button"
              className="sidebar-theme-btn scale-active"
              onClick={toggleTheme}
              aria-label="Mavzuni o'zgartirish"
              title="Mavzuni o'zgartirish"
            >
              {theme === 'dark' ? <IconSun size={15} /> : <IconMoon size={15} />}
            </button>
          )}
          {hasSettings && (
            <button
              type="button"
              className={`sidebar-theme-btn scale-active ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
              aria-label="Profil"
              title="Profil"
            >
              <IconUser size={16} />
            </button>
          )}
          {userRole === 'admin' && onLogout && (
            <button
              type="button"
              className="sidebar-logout-btn scale-active"
              onClick={onLogout}
              style={{ width: 'auto', padding: '6px 12px', gap: '6px' }}
            >
              <IconLogout size={16} />
              <span>Chiqish</span>
            </button>
          )}
        </div>
      </header>

      {/* Fixed Mobile Bottom Navigation Bar (<= 900px) */}
      {userRole !== 'student' && (
        <nav className="mobile-bottom-navbar" aria-label="Mobil navigatsiya">
          {filteredMenuItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`mobile-tab-btn scale-active ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <div className="mobile-tab-icon-wrap">
                {item.icon}
              </div>
              <span className="mobile-tab-label">{item.shortLabel || item.label}</span>
            </button>
          ))}
        </nav>
      )}

      {/* Scoped Sidebar Styles */}
      <style>{`
        /* Desktop Left Sidebar: Compact, Apple Minimalist */
        .app-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 220px;
          height: 100%;
          min-height: calc(100vh / 0.9);
          z-index: 500;
          background: var(--bg-primary, #F5F5F7);
          border-right: 1px solid rgba(0, 0, 0, 0.08);
          display: flex;
          flex-direction: column;
          padding: 16px 10px;
          box-sizing: border-box;
          user-select: none;
          overflow: hidden;
        }

        @media (max-height: 480px) {
          .app-sidebar {
            overflow-y: auto;
          }
          .sidebar-bottom-spacer {
            display: none;
          }
        }

        .app-sidebar::-webkit-scrollbar {
          display: none;
        }

        /* Sidebar Header: Logo on left, Theme button on right */
        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 2px 6px 14px 6px;
          width: 100%;
          box-sizing: border-box;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          margin-bottom: 0;
          flex-shrink: 0;
          height: 52px;
        }

        .sidebar-brand {
          cursor: pointer;
          display: flex;
          align-items: center;
        }

        .sidebar-logo-text {
          font-size: 1.08rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--text-primary);
          margin: 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .logo-badge {
          background: #1D1D1F;
          color: #FFFFFF;
          padding: 1.5px 7px;
          border-radius: var(--radius-full);
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.02em;
        }

        .admin-nav-role-badge {
          background: #8B5CF6;
          color: #FFFFFF;
          padding: 1.5px 7px;
          border-radius: var(--radius-full);
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.02em;
        }

        .sidebar-theme-btn {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.08);
          color: var(--text-primary);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
          flex-shrink: 0;
          padding: 0;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
        }

        .sidebar-theme-btn:hover {
          border-color: rgba(0, 0, 0, 0.16);
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
        }

        /* Navigation Wrapper (positioned at the top, directly under the logo) */
        .sidebar-nav-top-wrap {
          flex: 1 1 auto;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          width: 100%;
          min-height: 0;
          box-sizing: border-box;
          padding: 14px 0 8px 0;
        }

        /* Seamless Navigation Items List with Dock Magnification */
        .sidebar-nav-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: 100%;
          box-sizing: border-box;
          padding: 0;
          position: relative;
          align-items: center;
        }

        .sidebar-nav-btn {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 9px 12px;
          border-radius: 10px;
          border: 1px solid transparent;
          background: transparent;
          font-family: var(--font-family, -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif);
          font-size: 0.84rem;
          font-weight: 500;
          color: var(--text-secondary);
          text-align: left;
          cursor: pointer;
          width: calc(100% - 8px);
          max-width: 100%;
          margin: 0 auto;
          box-sizing: border-box;
          user-select: none;
          position: relative;
          transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
          -webkit-font-smoothing: antialiased;
        }

        .sidebar-nav-btn:hover:not(.active) {
          background: rgba(0, 0, 0, 0.04);
          color: var(--text-primary);
          box-shadow: none;
        }

        .sidebar-nav-btn:active {
          transform: scale(0.97);
          transition: transform 0.08s ease;
        }

        /* Active navigation pill: Solid black pill in light mode matching reference */
        .sidebar-nav-btn.active {
          background: #000000;
          color: #FFFFFF;
          font-weight: 600;
          border-color: #000000;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.14);
        }

        /* Bottom Teacher Profile Card Section (pinned to bottom naturally via flex: 1 on nav) */
        .sidebar-bottom-section {
          margin-top: auto;
          padding-top: 10px;
          flex-shrink: 0;
          width: 100%;
          box-sizing: border-box;
        }

        .sidebar-user-card {
          background: #F4F7FB;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 14px;
          padding: 10px 12px;
          box-sizing: border-box;
          width: 100%;
          transition: background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .user-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
          min-width: 0;
        }

        .user-card-role-label {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #8E8E93;
          text-transform: uppercase;
          user-select: none;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-card-actions {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
          min-width: 0;
        }

        .user-card-action-btn {
          width: 26px;
          height: 26px;
          border-radius: 7px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
          padding: 0;
          flex-shrink: 0;
        }

        .user-card-action-btn:hover {
          background: rgba(0, 0, 0, 0.06);
          color: var(--text-primary);
        }

        .user-card-action-btn.active {
          background: rgba(0, 0, 0, 0.08);
          color: var(--apple-blue);
        }

        .user-card-body {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          border-radius: 10px;
          padding: 2px;
          transition: opacity 0.15s ease;
          user-select: none;
        }

        .user-card-body:hover {
          opacity: 0.88;
        }

        .user-card-avatar-initials {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #0062D2;
          color: #FFFFFF;
          font-size: 0.82rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          letter-spacing: 0.02em;
          box-shadow: 0 2px 6px rgba(0, 98, 210, 0.25);
        }

        .user-card-avatar-img {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
        }

        .user-card-details {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-width: 0;
        }

        .user-card-name {
          font-size: 0.84rem;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.25;
        }

        .user-card-sub {
          font-size: 0.72rem;
          font-weight: 500;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.2;
          margin-top: 2px;
        }

        .sidebar-nav-divider {
          height: 1px;
          background: rgba(0, 0, 0, 0.06);
          margin: 6px auto;
          width: calc(100% - 16px);
        }

        .nav-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .nav-label {
          letter-spacing: -0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sidebar-logout-btn {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 9px 12px;
          font-family: var(--font-family, -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif);
          font-size: 0.84rem;
          font-weight: 500;
          background: transparent;
          color: #DC2626;
          border: 1px solid transparent;
          border-radius: 10px;
          cursor: pointer;
          width: calc(100% - 8px);
          margin: 0 auto;
          box-sizing: border-box;
          user-select: none;
          position: relative;
          transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
        }

        .sidebar-logout-btn:hover {
          background: rgba(239, 68, 68, 0.08);
          border-color: rgba(239, 68, 68, 0.15);
          color: #B91C1C;
        }

        .sidebar-logout-btn:active {
          transform: scale(0.97);
          transition: transform 0.08s ease;
        }

        /* Mobile Header: Top Bar for small screens */
        .mobile-top-header {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(12px) saturate(160%);
          -webkit-backdrop-filter: blur(12px) saturate(160%);
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
          padding: 8px 16px;
          padding-top: calc(8px + env(safe-area-inset-top, 0px));
          align-items: center;
          justify-content: space-between;
          box-sizing: border-box;
          height: calc(54px + env(safe-area-inset-top, 0px));
        }

        .mobile-brand {
          cursor: pointer;
          user-select: none;
          display: flex;
          align-items: center;
        }

        .mobile-header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Mobile Bottom Navigation Bar */
        .mobile-bottom-navbar {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          width: 100%;
          z-index: 99999;
          background: rgba(255, 255, 255, 0.94);
          backdrop-filter: blur(12px) saturate(160%);
          -webkit-backdrop-filter: blur(12px) saturate(160%);
          border-top: 1px solid rgba(0, 0, 0, 0.08);
          box-sizing: border-box;
          height: calc(64px + env(safe-area-inset-bottom, 0px));
          padding-top: 6px;
          padding-bottom: env(safe-area-inset-bottom, 0px);
          justify-content: space-around;
          align-items: center;
          touch-action: manipulation;
          user-select: none;
        }

        .mobile-tab-btn {
          flex: 1;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 4px 2px;
          transition: color 0.15s ease;
          user-select: none;
          min-width: 0;
        }

        .mobile-tab-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
        }

        .mobile-tab-label {
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: -0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
          line-height: 1;
        }

        .mobile-tab-btn.active {
          color: var(--apple-blue, #0071E3);
        }

        .mobile-tab-btn.active .mobile-tab-label {
          font-weight: 700;
        }

        /* Responsive Breakpoints: Desktop (> 900px) vs Mobile (<= 900px) */
        @media (min-width: 901px) {
          .app-sidebar {
            display: flex !important;
          }
          .mobile-top-header {
            display: none !important;
          }
          .mobile-bottom-navbar {
            display: none !important;
          }
        }

        @media (max-width: 900px) {
          .app-sidebar {
            display: none !important;
          }
          .mobile-top-header {
            display: flex !important;
          }
          .mobile-bottom-navbar {
            display: flex !important;
          }
        }

        /* Dark Mode Minimalist Overrides */
        [data-theme="dark"] .app-sidebar {
          background: #18191B;
          border-right-color: rgba(255, 255, 255, 0.08);
        }

        [data-theme="dark"] .sidebar-header {
          border-bottom-color: rgba(255, 255, 255, 0.06);
        }

        [data-theme="dark"] .sidebar-logo-text {
          color: #E8EAED;
        }

        [data-theme="dark"] .logo-badge {
          background: #3C4043;
          color: #E8EAED;
        }

        [data-theme="dark"] .sidebar-theme-btn {
          background: #25262A;
          border-color: rgba(255, 255, 255, 0.1);
          color: #FDD663;
        }

        [data-theme="dark"] .sidebar-theme-btn:hover {
          background: #303135;
          color: #FFE082;
        }

        [data-theme="dark"] .sidebar-nav-btn {
          color: #9AA0A6;
        }

        [data-theme="dark"] .sidebar-nav-btn:hover:not(.active) {
          background: rgba(255, 255, 255, 0.05);
          color: #FFFFFF;
          box-shadow: none;
        }

        [data-theme="dark"] .sidebar-nav-btn.active {
          background: #25262A;
          color: #FFFFFF;
          border-color: rgba(255, 255, 255, 0.12);
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
        }

        [data-theme="dark"] .sidebar-nav-divider {
          background: rgba(255, 255, 255, 0.08);
        }

        [data-theme="dark"] .sidebar-logout-btn {
          background: transparent;
          color: #F87171;
          border-color: transparent;
        }

        [data-theme="dark"] .sidebar-logout-btn:hover {
          background: rgba(239, 68, 68, 0.14);
          border-color: rgba(239, 68, 68, 0.25);
          color: #FCA5A5;
        }

        /* Dark Mode Overrides for Bottom User Card */
        [data-theme="dark"] .sidebar-user-card {
          background: #202226;
          border-color: rgba(255, 255, 255, 0.08);
        }

        [data-theme="dark"] .user-card-role-label {
          color: #9AA0A6;
        }

        [data-theme="dark"] .user-card-action-btn {
          color: #9AA0A6;
        }

        [data-theme="dark"] .user-card-action-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #FFFFFF;
        }

        [data-theme="dark"] .user-card-action-btn.active {
          background: rgba(255, 255, 255, 0.14);
          color: var(--apple-blue);
        }

        [data-theme="dark"] .user-card-name {
          color: #FFFFFF;
        }

        [data-theme="dark"] .user-card-sub {
          color: #9AA0A6;
        }

        [data-theme="dark"] .user-card-avatar-initials {
          background: #0071E3;
          box-shadow: 0 2px 8px rgba(0, 113, 227, 0.35);
        }

        [data-theme="dark"] .mobile-top-header {
          background: rgba(24, 25, 27, 0.94);
          border-bottom-color: rgba(255, 255, 255, 0.08);
        }

        [data-theme="dark"] .mobile-bottom-navbar {
          background: rgba(24, 25, 27, 0.95);
          border-top-color: rgba(255, 255, 255, 0.08);
        }
      `}</style>
    </>
  );
};

export default Sidebar;
