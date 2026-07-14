import { useState, useEffect } from 'react';

const getNavIcon = (key) => {
  const icons = {
    'overview': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
      </svg>
    ),
    'user-management': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    ),
    'add-origin': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="16"></line>
        <line x1="8" y1="12" x2="16" y2="12"></line>
      </svg>
    ),
    'api-endpoints': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 7h16M4 12h16M4 17h16"></path>
        <circle cx="8" cy="7" r="1"></circle>
        <circle cx="8" cy="12" r="1"></circle>
        <circle cx="8" cy="17" r="1"></circle>
      </svg>
    ),
    'help': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
    ),
    'privacy': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        <path d="M9 12l2 2 4-4"></path>
      </svg>
    ),
    'requests': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    ),
    'messages': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    ),
    'backup': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
    ),
  };
  return icons[key] || (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  );
};

export default function DashboardLayout({
  user,
  navItems,
  activeNav,
  onNavSelect,
  onOpenSettings,
  onLogout,
  isLoggingOut,
  chatUnreadCount = 0,
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const displayName = user?.name || 'User';
  const items = Array.isArray(navItems) ? navItems : [];
  const messagesUnread = typeof chatUnreadCount === 'number' ? chatUnreadCount : 0;

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 960) {
        setSidebarOpen(false);
      }
    };

    const handleClickOutside = (e) => {
      if (sidebarOpen && window.innerWidth <= 960) {
        const sidebar = document.querySelector('.sidebar');
        const toggle = document.querySelector('.sidebar-toggle');
        if (sidebar && toggle && !sidebar.contains(e.target) && !toggle.contains(e.target)) {
          setSidebarOpen(false);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sidebarOpen]);

  return (
    <div className="dashboard-shell">
      <button
        className="sidebar-toggle"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
        aria-expanded={sidebarOpen}
      >
        <span className="hamburger-icon">
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>
      {sidebarOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}
      <aside className={`sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="sidebar-top">
          <div className="brand" aria-label="EcoWatch" style={{ padding: '0.8rem 0.85rem 0.6rem' }}>
            <div className="brand-mark">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 38C8 38 6 14 24 8C24 8 26 32 8 38Z" fill="#10b981" opacity="0.9" transform="translate(0,-12) scale(0.85)"/>
                <circle cx="17" cy="15" r="4" stroke="#047857" strokeWidth="1.5" fill="white" fillOpacity="0.4"/>
                <line x1="20" y1="18" x2="22" y2="20" stroke="#047857" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="brand-text">
              <span className="brand-title">
                <span className="brand-title-eco">Eco</span>
                <span className="brand-title-watch">Watch</span>
              </span>
              <span className="brand-subtitle">{displayName}</span>
            </div>
          </div>

          <nav className="nav" aria-label="Primary" style={{ padding: '0 0.85rem' }}>
            <ul className="nav-list">
              {items.map((item) => {
                const isActive = item.key === activeNav;
                return (
                  <li key={item.key} className="nav-list-item">
                    <button
                      type="button"
                      className={`nav-button${isActive ? ' is-active' : ''}`}
                      aria-current={isActive ? 'page' : undefined}
                      onClick={() => {
                        onNavSelect?.(item.key);
                        if (window.innerWidth <= 960) {
                          setSidebarOpen(false);
                        }
                      }}
                    >
                      <span className="nav-icon">{getNavIcon(item.key)}</span>
                      <span className="nav-label">{item.label}</span>
                      {item.key === 'messages' && messagesUnread > 0 && (
                        <span className="nav-badge" aria-label={`${messagesUnread} unread`}>
                          {messagesUnread > 99 ? '99+' : messagesUnread}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="sidebar-bottom" aria-label="Secondary" style={{ padding: '0.6rem 0.85rem 0.85rem' }}>
          <button
            type="button"
            className={`secondary-button secondary-button--settings${activeNav === 'settings' ? ' is-active' : ''}`}
            onClick={() => {
              onOpenSettings?.();
              if (window.innerWidth <= 960) {
                setSidebarOpen(false);
              }
            }}
          >
            <span className="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"></path>
              </svg>
            </span>
            <span className="nav-label">SETTINGS</span>
          </button>
          <button
            type="button"
            className="secondary-button secondary-button--logout"
            onClick={onLogout}
            disabled={isLoggingOut}
          >
            <span className="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </span>
            <span className="nav-label">{isLoggingOut ? 'LOGGING OUT...' : 'LOGOUT'}</span>
          </button>
        </div>
      </aside>

      <main className="content">
        <div className="content-inner">{children}</div>
      </main>

      <style jsx>{`
        .dashboard-shell {
          height: 100vh;
          display: flex;
          background: #f8fafc;
          color: #0f172a;
          overflow: hidden;
          position: relative;
        }

        .sidebar-toggle {
          display: none;
          position: fixed;
          top: 1rem;
          right: 1rem;
          z-index: 1001;
          background: #ffffff;
          color: #0f172a;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 0.75rem;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          width: 48px;
          height: 48px;
          align-items: center;
          justify-content: center;
        }

        .sidebar-toggle:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
        }

        .sidebar-toggle:active {
          transform: scale(0.98);
        }

        .hamburger-icon {
          display: flex;
          flex-direction: column;
          gap: 4px;
          width: 24px;
          height: 18px;
        }

        .hamburger-icon span {
          display: block;
          width: 100%;
          height: 2px;
          background: #0f172a;
          border-radius: 2px;
          transition: transform 0.3s ease, opacity 0.3s ease;
        }

        .sidebar {
          width: min(236px, 21vw);
          background: linear-gradient(180deg, #02201a 0%, #064e3b 40%, #065f46 70%, #047857 100%);
          color: #d1fae5;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          height: 100%;
          padding: 0;
          border-right: 1px solid rgba(16, 185, 129, 0.15);
          box-shadow: 16px 0 42px rgba(2, 32, 26, 0.35);
          transition: transform 0.3s ease;
          position: relative;
          overflow: hidden;
          isolation: isolate;
        }

        .sidebar::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 20% 10%, rgba(16, 185, 129, 0.15), transparent 55%),
            radial-gradient(circle at 80% 90%, rgba(5, 150, 105, 0.12), transparent 60%);
          opacity: 0.98;
          pointer-events: none;
          z-index: 0;
        }

        .sidebar-top {
          display: flex;
          flex-direction: column;
          padding: 0;
          gap: 1.05rem;
          min-height: 0;
          position: relative;
          z-index: 1;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 0.9rem;
        }

        .brand-mark {
          width: 2.75rem;
          height: 2.75rem;
          border-radius: 12px;
          background: rgba(16, 185, 129, 0.15);
          display: grid;
          place-items: center;
          border: 1px solid rgba(16, 185, 129, 0.25);
          box-shadow: 0 8px 16px rgba(2, 32, 26, 0.3);
          flex-shrink: 0;
        }

        .brand-text {
          display: flex;
          flex-direction: column;
          line-height: 1.2;
        }

        .brand-title {
          font-weight: 700;
          font-size: 0.9rem;
          letter-spacing: 0.02em;
          display: flex;
          align-items: center;
          line-height: 1.2;
        }
        .brand-title-eco {
          color: #34d399;
        }
        .brand-title-watch {
          color: #ffffff;
        }

        .brand-subtitle {
          font-size: 0.72rem;
          color: rgba(209, 250, 229, 0.75);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 140px;
        }

        .nav-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          padding: 0;
          margin: 0;
        }

        .nav-button {
          width: 100%;
          text-align: left;
          padding: 0.75rem 0.9rem;
          border-radius: 10px;
          border: 1px solid rgba(16, 185, 129, 0.12);
          background: rgba(255, 255, 255, 0.06);
          color: #d1fae5;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s ease;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.7rem;
          position: relative;
        }

        .nav-button:hover,
        .nav-button:focus-visible {
          outline: none;
          background: rgba(16, 185, 129, 0.15);
          border-color: rgba(16, 185, 129, 0.3);
          transform: translateX(3px);
          color: #ffffff;
        }

        .nav-button.is-active {
          background: rgba(16, 185, 129, 0.25);
          border-color: rgba(52, 211, 153, 0.5);
          color: #ffffff;
        }

        .nav-button.is-active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 55%;
          background: #34d399;
          border-radius: 0 3px 3px 0;
        }

        .nav-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 20px;
          height: 20px;
          opacity: 0.8;
          transition: opacity 0.2s ease, transform 0.2s ease, color 0.2s ease;
          color: currentColor;
        }

        .nav-button:hover .nav-icon,
        .nav-button.is-active .nav-icon {
          opacity: 1;
          transform: scale(1.1);
        }

        .nav-label {
          text-transform: uppercase;
          letter-spacing: 0.04em;
          font-size: 0.82rem;
          font-weight: 600;
          transition: color 0.2s ease;
        }

        .nav-button.is-active .nav-label {
          font-weight: 700;
        }

        .nav-badge {
          flex-shrink: 0;
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          border-radius: 999px;
          background: #ef4444;
          color: #fff;
          font-size: 0.7rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-left: auto;
          box-shadow: 0 2px 6px rgba(239, 68, 68, 0.4);
        }

        .sidebar-bottom {
          margin-top: auto;
          display: grid;
          gap: 0.5rem;
          padding: 0;
          position: relative;
          z-index: 1;
        }

        .secondary-button {
          width: 100%;
          text-align: left;
          padding: 0.7rem 0.9rem;
          border-radius: 10px;
          border: 1px solid rgba(16, 185, 129, 0.12);
          background: rgba(255, 255, 255, 0.06);
          color: #d1fae5;
          font-size: 0.82rem;
          font-weight: 600;
          transition: all 0.2s ease;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.7rem;
          position: relative;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .secondary-button .nav-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 20px;
          height: 20px;
          opacity: 0.8;
          transition: opacity 0.2s ease, transform 0.2s ease;
          color: currentColor;
        }

        .secondary-button .nav-label {
          text-transform: uppercase;
          letter-spacing: 0.04em;
          font-size: 0.82rem;
          font-weight: 600;
        }

        .secondary-button:hover .nav-icon,
        .secondary-button.is-active .nav-icon {
          opacity: 1;
          transform: scale(1.1);
        }

        .secondary-button:hover,
        .secondary-button:focus-visible {
          outline: none;
          transform: translateX(3px);
          background: rgba(16, 185, 129, 0.15);
          border-color: rgba(16, 185, 129, 0.3);
          color: #ffffff;
        }

        .secondary-button--settings:hover,
        .secondary-button--settings:focus-visible {
          background: rgba(16, 185, 129, 0.2);
          color: #ffffff;
        }

        .secondary-button--settings.is-active {
          background: rgba(16, 185, 129, 0.25);
          border-color: rgba(52, 211, 153, 0.5);
          color: #ffffff;
        }

        .secondary-button--settings.is-active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 55%;
          background: #34d399;
          border-radius: 0 3px 3px 0;
        }

        .secondary-button--settings.is-active .nav-label {
          font-weight: 700;
        }

        .secondary-button--logout {
          background: rgba(239, 68, 68, 0.12);
          color: #fca5a5;
          border-color: rgba(239, 68, 68, 0.2);
        }

        .secondary-button--logout:hover,
        .secondary-button--logout:focus-visible {
          background: rgba(239, 68, 68, 0.25);
          border-color: rgba(239, 68, 68, 0.4);
          color: #ffffff;
        }

        .secondary-button--logout:disabled {
          cursor: wait;
          opacity: 0.7;
          transform: none;
        }

        .content {
          flex: 1;
          display: flex;
          min-height: 0;
        }

        .content-inner {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 0 3rem 2.5rem 3rem;
          overflow-y: auto;
          gap: 2rem;
        }

        @media (max-width: 960px) {
          .sidebar-toggle {
            display: flex;
          }

          .dashboard-shell {
            flex-direction: column;
            height: 100vh;
          }

          .sidebar {
            position: fixed;
            top: 0;
            left: 0;
            width: min(280px, 85vw);
            height: 100vh;
            z-index: 1000;
            transform: translateX(-100%);
            box-shadow: 2px 0 12px rgba(0, 0, 0, 0.15);
            overflow-y: auto;
            overflow-x: hidden;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .sidebar.is-open {
            transform: translateX(0);
          }

          .sidebar-top,
          .sidebar-bottom {
            padding: 1.25rem;
          }

          .sidebar-top {
            padding-top: 1.25rem;
          }

          .nav-list {
            display: flex;
            flex-direction: column;
            gap: 0.4rem;
          }

          .nav-button {
            padding: 0.65rem 0.85rem;
            font-size: 0.85rem;
          }

          .nav-icon {
            width: 18px;
            height: 18px;
          }

          .secondary-button {
            width: 100%;
            padding: 0.65rem 0.85rem;
            font-size: 0.85rem;
          }

          .secondary-button .nav-icon {
            width: 18px;
            height: 18px;
          }

          .content-inner {
            padding: 2rem 1.5rem 3rem;
            margin-top: 0;
            padding-top: 4.5rem;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            overflow-x: hidden;
          }

          .sidebar-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999;
            animation: fadeIn 0.3s ease;
            backdrop-filter: blur(2px);
            -webkit-backdrop-filter: blur(2px);
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @media (max-width: 640px) {
          .sidebar-toggle {
            top: 0.75rem;
            right: 0.75rem;
            width: 44px;
            height: 44px;
            padding: 0.65rem;
            border-radius: 10px;
          }

          .content-inner {
            padding: 1.5rem 1rem 2rem;
            padding-top: 4rem;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            overflow-x: hidden;
          }

          .sidebar {
            width: min(260px, 90vw);
          }

          .nav-button {
            padding: 0.6rem 0.75rem;
            font-size: 0.82rem;
            gap: 0.6rem;
          }

          .nav-icon {
            width: 16px;
            height: 16px;
          }

          .secondary-button {
            padding: 0.6rem 0.75rem;
            font-size: 0.82rem;
            gap: 0.6rem;
          }

          .secondary-button .nav-icon {
            width: 16px;
            height: 16px;
          }

          .brand-mark {
            width: 2.5rem;
            height: 2.5rem;
            border-radius: 10px;
          }

          .sidebar-top,
          .sidebar-bottom {
            padding: 1rem;
          }
        }

        @media (max-width: 480px) {
          .nav-button {
            padding: 0.55rem 0.7rem;
            font-size: 0.78rem;
            gap: 0.55rem;
          }

          .nav-label {
            font-size: 0.78rem;
          }

          .secondary-button {
            padding: 0.55rem 0.7rem;
            font-size: 0.78rem;
            gap: 0.55rem;
          }

          .secondary-button .nav-label {
            font-size: 0.78rem;
          }
        }
      `}</style>
    </div>
  );
}
