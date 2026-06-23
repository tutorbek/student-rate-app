import React from 'react';

const Sidebar = ({ activeTab, setActiveTab, userRole, onLogout }) => {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" rx="1.5" />
          <rect x="14" y="3" width="7" height="5" rx="1.5" />
          <rect x="14" y="12" width="7" height="9" rx="1.5" />
          <rect x="3" y="16" width="7" height="5" rx="1.5" />
        </svg>
      ),
    },
    {
      id: 'groups',
      label: 'Guruhlar',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      id: 'leaderboard',
      label: 'Leaderboard',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
          <path d="M12 2a4 4 0 0 1 4 4v7a4 4 0 0 1-4 4 4 4 0 0 1-4-4V6a4 4 0 0 1 4-4Z" />
        </svg>
      ),
    },
    {
      id: 'history',
      label: 'Tarix',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      id: 'settings',
      label: 'Sozlamalar',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
  ];

  const filteredMenuItems = menuItems.filter((item) => {
    if (userRole === 'student') {
      return item.id === 'leaderboard' || item.id === 'history';
    }
    return true;
  });

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sidebar glass">
        <div className="sidebar-logo">
          <h1 className="logo-text">InsightPlus</h1>
        </div>
        <nav className="sidebar-nav">
          {filteredMenuItems.map((item) => (
            <button
              key={item.id}
              className={`sidebar-link scale-active ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-footer-top">
            <span className="badge badge-blue">
              {userRole === 'student' ? 'Student Mode' : 'Teacher Mode'}
            </span>
            <span className="footer-version">v1.0.0</span>
          </div>
          <button className="logout-btn scale-active" onClick={onLogout}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Chiqish
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-nav glass">
        {filteredMenuItems.map((item) => (
          <button
            key={item.id}
            className={`mobile-link scale-active ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
            title={item.label}
          >
            <span className="mobile-icon">{item.icon}</span>
            <span className="mobile-label">{item.label}</span>
          </button>
        ))}
        <button
          className="mobile-link scale-active mobile-logout"
          onClick={onLogout}
          title="Chiqish"
        >
          <span className="mobile-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </span>
          <span className="mobile-label">Chiqish</span>
        </button>
      </nav>

      {/* Sidebar and Mobile Nav CSS */}
      <style>{`
        /* Sidebar Styles */
        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: var(--sidebar-width);
          border-right: 1px solid #000000;
          display: flex;
          flex-direction: column;
          padding: 24px;
          z-index: 100;
          background: #ffffff;
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 40px;
          padding: 8px 0;
          border-bottom: 1px solid #000000;
        }

        .logo-icon {
          font-size: 1.6rem;
        }

        .logo-text {
          font-size: 1.3rem;
          font-weight: 800;
          color: #000000;
          text-transform: uppercase;
          letter-spacing: -0.5px;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
        }

        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 16px;
          border-radius: 0;
          background: transparent;
          border: 1px solid transparent;
          color: #000000;
          font-family: var(--font-family);
          font-size: 0.9rem;
          font-weight: 700;
          text-align: left;
          cursor: pointer;
          transition: all var(--transition-fast);
          width: 100%;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .sidebar-link:hover {
          color: #000000;
          background: #E7FF56;
          border-color: #000000;
        }

        .sidebar-link.active {
          color: #000000;
          background: #E7FF56;
          border-color: #000000;
        }

        .sidebar-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sidebar-footer {
          padding: 16px 0;
          border-top: 1px solid #000000;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .sidebar-footer-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logout-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 16px;
          background: transparent;
          border: 1.5px solid #000000;
          color: #000000;
          font-family: var(--font-family);
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all var(--transition-fast);
          border-radius: 0;
        }

        .logout-btn:hover {
          background: #ff3b30;
          border-color: #ff3b30;
          color: #ffffff;
        }

        .footer-version {
          font-size: 0.75rem;
          color: #000000;
          font-weight: 600;
        }

        /* Mobile Bottom Nav */
        .mobile-nav {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 72px;
          border-top: 1px solid #000000;
          justify-content: space-around;
          align-items: center;
          padding: 0 12px;
          z-index: 100;
          background: #ffffff;
        }

        .mobile-link {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0;
          background: transparent;
          border: none;
          color: #000000;
          cursor: pointer;
          flex: 1;
          height: 100%;
          transition: all var(--transition-fast);
        }

        .mobile-link.active {
          background: #000000;
          color: #ffffff;
        }

        .mobile-logout:hover {
          background: #ff3b30;
          color: #ffffff;
        }

        .mobile-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mobile-label {
          display: none;
        }

        @media (max-width: 900px) {
          .sidebar {
            display: none;
          }
          .mobile-nav {
            display: flex;
          }
        }
      `}</style>
    </>
  );
};

export default Sidebar;
