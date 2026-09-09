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

const Navbar = ({ activeTab, setActiveTab, userRole, onLogout, theme, toggleTheme }) => {
  const menuItems = [
    {
      id: 'schedule',
      label: 'Dars Jadvalim',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      ),
    },
    {
      id: 'groups',
      label: 'Guruhlar',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      id: 'leaderboard',
      label: 'Reyting',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
          <path d="M12 2a4 4 0 0 1 4 4v7a4 4 0 0 1-4 4 4 4 0 0 1-4-4V6a4 4 0 0 1 4-4Z" />
        </svg>
      ),
    },
    {
      id: 'attendance',
      label: 'Davomad',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      ),
    },
    {
      id: 'settings',
      label: 'Sozlama',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l-.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06-.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
  ];

  const filteredMenuItems = menuItems.filter((item) => {
    if (userRole === 'student') {
      return item.id === 'leaderboard';
    }
    if (userRole === 'admin') {
      return item.id === 'dashboard' || item.id === 'groups' || item.id === 'attendance';
    }
    return true;
  });

  return (
    <>
      {/* Top Navbar */}
      <header className="app-navbar">
        <div className="navbar-inner">
          {/* Brand Logo */}
          <div
            className="navbar-brand-section scale-active"
            onClick={() => setActiveTab(userRole === 'student' ? 'leaderboard' : userRole === 'admin' ? 'dashboard' : 'schedule')}
          >
            <h1 className="navbar-logo-text">
              EPCHIL <span className="logo-badge">ROBOT</span>
              {userRole === 'admin' && <span className="admin-nav-role-badge">ADMIN</span>}
            </h1>
          </div>

          {/* Student Mode Header Actions */}
          {userRole === 'student' && (
            <div className="student-header-actions">
              {toggleTheme && (
                <button
                  type="button"
                  className="btn btn-secondary scale-active theme-toggle-btn"
                  onClick={toggleTheme}
                  aria-label="Mavzuni o'zgartirish"
                >
                  {theme === 'dark' ? <IconSun size={15} /> : <IconMoon size={15} />}
                </button>
              )}
              {onLogout && (
                <button 
                  type="button" 
                  className="btn btn-secondary scale-active student-logout-btn"
                  onClick={onLogout}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>Chiqish</span>
                </button>
              )}
            </div>
          )}

          {/* Teacher & Admin Desktop Nav Links */}
          {userRole !== 'student' && (
            <div className="teacher-header-actions">
              {toggleTheme && (
                <button
                  type="button"
                  className="btn btn-secondary scale-active theme-toggle-btn"
                  onClick={toggleTheme}
                  aria-label="Mavzuni o'zgartirish"
                >
                  {theme === 'dark' ? <IconSun size={15} /> : <IconMoon size={15} />}
                </button>
              )}
              <nav className="navbar-nav-desktop">
                {filteredMenuItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`nav-item-btn scale-active ${item.id === 'settings' ? 'nav-item-icon-only' : ''} ${activeTab === item.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    {item.id !== 'settings' && <span className="nav-label">{item.label}</span>}
                  </button>
                ))}
              </nav>

              {userRole === 'admin' && onLogout && (
                <button
                  type="button"
                  className="btn btn-secondary scale-active student-logout-btn"
                  onClick={onLogout}
                  style={{ marginLeft: 4 }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>Chiqish</span>
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Fixed Mobile & Tablet Bottom Navigation Bar (Teachers Only, as Students have full-screen view) */}
      {userRole !== 'student' && (
        <nav className="mobile-bottom-navbar">
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
              <span className="mobile-tab-label">{item.label}</span>
            </button>
          ))}
        </nav>
      )}

      {/* Navbar Styles */}
      <style>{`
        .app-navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px) saturate(160%);
          -webkit-backdrop-filter: blur(12px) saturate(160%);
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
          width: 100%;
          padding-top: env(safe-area-inset-top, 0px);
          box-sizing: border-box;
          transform: translate3d(0, 0, 0);
          -webkit-transform: translate3d(0, 0, 0);
        }

        .navbar-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 12px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .navbar-brand-section {
          cursor: pointer;
          user-select: none;
          flex-shrink: 0;
          display: flex;
          align-items: center;
        }

        .navbar-logo-text {
          font-size: 1.15rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--text-primary);
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .logo-badge {
          background: #1D1D1F;
          color: #FFFFFF;
          padding: 2px 8px;
          border-radius: var(--radius-full);
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          transition: background-color var(--transition-fast), color var(--transition-fast);
        }

        .admin-nav-role-badge {
          background: #8B5CF6;
          color: #FFFFFF;
          padding: 2px 8px;
          border-radius: var(--radius-full);
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.02em;
        }



        .student-header-actions,
        .teacher-header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .student-logout-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          font-family: var(--font-family);
          font-size: 0.82rem;
          font-weight: 600;
          background: #FEE2E2;
          color: #DC2626;
          border: 1px solid #FECACA;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .student-logout-btn:hover {
          background: #FCA5A5;
        }

        /* Desktop Nav Links */
        .navbar-nav-desktop {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
          justify-content: flex-end;
          background: #F5F5F7;
          padding: 4px;
          border-radius: var(--radius-md);
          border: 1px solid rgba(0, 0, 0, 0.04);
        }

        .nav-item-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 7px 14px;
          background: transparent;
          border: none;
          border-radius: var(--radius-sm);
          font-family: var(--font-family);
          font-size: 0.84rem;
          font-weight: 600;
          color: var(--text-secondary);
          letter-spacing: -0.01em;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .nav-item-btn:hover {
          color: var(--text-primary);
          background: rgba(0, 0, 0, 0.04);
        }

        .nav-item-btn.active {
          background: #FFFFFF;
          color: var(--text-primary);
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
        }

        .nav-item-btn.nav-item-icon-only {
          padding: 7px 10px;
        }

        .nav-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Fixed Mobile & Tablet Bottom Navigation Bar */
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
          transform: translate3d(0, 0, 0);
          -webkit-transform: translate3d(0, 0, 0);
          contain: layout paint;
          isolation: isolate;
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
          transition: color var(--transition-fast), transform var(--transition-fast);
          user-select: none;
          touch-action: manipulation;
          min-width: 0;
          box-sizing: border-box;
          position: relative;
        }

        .mobile-tab-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          flex-shrink: 0;
          transition: transform var(--transition-fast);
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
          color: var(--apple-blue);
        }

        .mobile-tab-btn.active .mobile-tab-label {
          font-weight: 700;
        }

        /* Mobile and Tablet Breakpoints (<= 900px) */
        @media (max-width: 900px) {
          .navbar-nav-desktop {
            display: none;
          }

          .navbar-inner {
            padding: 10px 16px;
          }

          .mobile-bottom-navbar {
            display: flex;
          }
        }
      `}</style>
    </>
  );
};

export default Navbar;



