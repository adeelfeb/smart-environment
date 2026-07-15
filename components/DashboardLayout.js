import { useState, useEffect, useRef, useCallback } from 'react';

const SIDEBAR_COLLAPSE_KEY = 'ix-sidebar-collapsed';

const EcoWatchLogo = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <defs>
      <linearGradient id="ewLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#22c55e" />
        <stop offset="50%" stopColor="#16a34a" />
        <stop offset="100%" stopColor="#15803d" />
      </linearGradient>
    </defs>
    <rect width="40" height="40" rx="10" fill="url(#ewLogoGrad)" />
    <path d="M12 28C12 28 10 14 24 10C24 10 26 26 12 28Z" fill="white" opacity="0.95" />
    <path d="M18 26C18 26 17 18 26 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" fill="none" />
  </svg>
);

const getNavIcon = (key) => {
  const icons = {
    'admin-dashboard': (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
      </svg>
    ),
    'submit-complaint': (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="16"></line>
        <line x1="8" y1="12" x2="16" y2="12"></line>
      </svg>
    ),
    'complaint-history': (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
      </svg>
    ),
    'complaints': (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
      </svg>
    ),
    'gis-map': (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
        <line x1="8" y1="2" x2="8" y2="18"></line>
        <line x1="16" y1="6" x2="16" y2="22"></line>
      </svg>
    ),
    'analytics': (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"></line>
        <line x1="12" y1="20" x2="12" y2="4"></line>
        <line x1="6" y1="20" x2="6" y2="14"></line>
      </svg>
    ),
    'corporations': (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18"></path>
        <path d="M5 21V7l8-4v18"></path>
        <path d="M19 21V11l-6-4"></path>
        <path d="M9 9v.01"></path>
        <path d="M9 12v.01"></path>
        <path d="M9 15v.01"></path>
      </svg>
    ),
    'citizen-management': (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    ),
    'audit-logs': (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"></path>
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
      </svg>
    ),
    'system-settings': (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"></path>
      </svg>
    ),
    'user-management': (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    ),
    'help': (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
    ),
    'backup': (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
    ),
  };
  return icons[key] || (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  );
};

const NAV_ICON_COLORS = [
  'rowIconPurple', 'rowIconViolet', 'rowIconIndigo',
  'rowIconTeal', 'rowIconSlate', 'rowIconAmber',
];

function getIconColor(index) {
  return NAV_ICON_COLORS[index % NAV_ICON_COLORS.length];
}

export default function DashboardLayout({
  user,
  navItems,
  activeNav,
  onNavSelect,
  onOpenSettings,
  onLogout,
  isLoggingOut,
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const sidebarRef = useRef(null);
  const settingsRef = useRef(null);
  const displayName = user?.name || 'User';
  const userRole = (user?.role || '').toLowerCase();
  const items = Array.isArray(navItems) ? navItems : [];

  // Restore collapsed state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSE_KEY);
      if (stored === 'true') setCollapsed(true);
    } catch {}
  }, []);

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem(SIDEBAR_COLLAPSE_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  useEffect(() => {
    if (!sidebarOpen) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [sidebarOpen]);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  useEffect(() => {
    if (!settingsOpen) return;
    const handleClickOutside = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setSettingsOpen(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') setSettingsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [settingsOpen]);

  return (
    <div className="ix-page">
      {/* TopBar (standalone mode) */}
      <header className="ix-topbar">
        <div className="ix-topbar-left">
          <button
            className="ix-topbar-collapse"
            onClick={toggleCollapse}
            aria-label="Toggle sidebar"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {collapsed ? (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="15" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
          <button className="ix-topbar-burger" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="ix-topbar-brand">
            <EcoWatchLogo size={28} />
            <div className="ix-topbar-titles">
              <h1 className="ix-topbar-title">EcoWatch</h1>
              <p className="ix-topbar-subtitle">{displayName}</p>
            </div>
          </div>
        </div>
        <div className="ix-topbar-right">
          <button className="ix-topbar-icon-btn ix-topbar-notif" aria-label="Notifications" title="Notifications">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <span className="ix-notif-dot" />
          </button>
          <div className="ix-settings-wrap" ref={settingsRef}>
            <button
              className={`ix-topbar-icon-btn ix-topbar-settings${settingsOpen ? ' ix-topbar-settings--open' : ''}`}
              onClick={() => setSettingsOpen(prev => !prev)}
              aria-label="Settings"
              title="Settings"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </button>
            {settingsOpen && (
              <div className="ix-settings-dropdown">
                <div className="ix-settings-header">
                  <div className="ix-settings-avatar">
                    {(displayName || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="ix-settings-userinfo">
                    <span className="ix-settings-username">{displayName}</span>
                    <span className="ix-settings-userrole">{userRole}</span>
                  </div>
                </div>
                <div className="ix-settings-divider" />
                <button
                  className="ix-settings-item"
                  onClick={() => { onOpenSettings?.(); setSettingsOpen(false); }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>My Profile</span>
                </button>
                {(userRole === 'superadmin' || userRole === 'developer') && (
                  <button
                    className="ix-settings-item"
                    onClick={() => { onNavSelect?.('system-settings'); setSettingsOpen(false); }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                    <span>System Settings</span>
                  </button>
                )}
                <button
                  className="ix-settings-item"
                  onClick={() => { onNavSelect?.('help'); setSettingsOpen(false); }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <span>Help & Support</span>
                </button>
                <div className="ix-settings-divider" />
                <button
                  className="ix-settings-item ix-settings-item--logout"
                  onClick={() => { setSettingsOpen(false); onLogout?.(); }}
                  disabled={isLoggingOut}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Shell: sidebar + content */}
      <div className={`ix-shell${collapsed ? ' ix-shell--collapsed' : ''}`}>
        {/* Mobile overlay */}
        {sidebarOpen && <div className="ix-overlay" onClick={() => setSidebarOpen(false)} />}

        {/* Left Sidebar */}
        <aside
          className={`ix-sidebar${sidebarOpen ? ' ix-sidebar--open' : ''}${collapsed ? ' ix-sidebar--collapsed' : ''}`}
          ref={sidebarRef}
        >
          {/* Brand */}
          <div className="ix-brand">
            <div className="ix-brand-mark">
              <EcoWatchLogo size={20} />
            </div>
            {!collapsed && (
              <div className="ix-brand-text">
                <span className="ix-brand-name">EcoWatch</span>
                <span className="ix-brand-user">{displayName}</span>
              </div>
            )}
          </div>

          {/* Mobile close */}
          <button className="ix-sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Nav items */}
          <nav className="ix-nav">
            <div className="ix-nav-group">
              {!collapsed && <div className="ix-section-label">Navigation</div>}
              {items.map((item, idx) => {
                const active = item.key === activeNav;
                const iconColor = getIconColor(idx);
                return (
                  <button
                    key={item.key}
                    className={`ix-nav-item${active ? ' ix-nav-item--active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => { onNavSelect?.(item.key); setSidebarOpen(false); }}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className={`ix-nav-icon ${iconColor}`}>{getNavIcon(item.key)}</span>
                    {!collapsed && <span className="ix-nav-label">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="ix-sidebar-footer">
            <button
              className={`ix-nav-item${activeNav === 'settings' ? ' ix-nav-item--active' : ''}`}
              onClick={() => { onOpenSettings?.(); setSidebarOpen(false); }}
              title={collapsed ? 'Settings' : undefined}
            >
              <span className="ix-nav-icon rowIconSlate">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"></path>
                </svg>
              </span>
              {!collapsed && <span className="ix-nav-label">Settings</span>}
            </button>
            <button
              className="ix-nav-item ix-nav-item--logout"
              onClick={onLogout}
              disabled={isLoggingOut}
              title={collapsed ? (isLoggingOut ? 'Logging out...' : 'Logout') : undefined}
            >
              <span className="ix-nav-icon rowIconSlate">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </span>
              {!collapsed && <span className="ix-nav-label">{isLoggingOut ? 'Logging out...' : 'Logout'}</span>}
            </button>
          </div>
        </aside>

        {/* Content */}
        <main className="ix-content">
          <div className="ix-content-scroll">{children}</div>
        </main>
      </div>

      <style jsx>{`
        .ix-page {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          color: var(--ix-text);
          font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Inter, sans-serif;
          background-color: #eef4f3;
          background-image:
            radial-gradient(ellipse 110% 70% at 100% -15%, rgba(16, 185, 129, 0.12), transparent 52%),
            radial-gradient(ellipse 85% 55% at 0% 5%, rgba(5, 150, 105, 0.09), transparent 48%),
            radial-gradient(ellipse 75% 45% at 55% 105%, rgba(52, 211, 153, 0.07), transparent 50%),
            linear-gradient(168deg, #f0fdf4 0%, #ecfdf5 36%, #f8fafc 68%, #f0fdf4 100%);
        }

        @media (min-width: 1100px) {
          .ix-page {
            height: 100dvh;
            max-height: 100dvh;
            overflow: hidden;
          }
        }

        .ix-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.6rem;
          padding: 0.28rem 0.55rem;
          margin: 0.32rem 0.32rem 0;
          min-height: 0;
          flex-shrink: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(240,253,244,0.88) 100%);
          backdrop-filter: var(--ix-glass-blur);
          -webkit-backdrop-filter: var(--ix-glass-blur);
          border: 1px solid rgba(16, 185, 129, 0.18);
          border-radius: 14px;
          box-shadow: 0 4px 24px rgba(5, 150, 105, 0.07), 0 1px 3px rgba(0,0,0,0.04);
          z-index: 50;
        }
        .ix-topbar-left {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          min-width: 0;
        }
        .ix-topbar-collapse {
          display: none;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 9px;
          border: 1px solid rgba(16, 185, 129, 0.2);
          background: rgba(240, 253, 244, 0.7);
          color: #059669;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 160ms ease;
        }
        .ix-topbar-collapse:hover {
          background: rgba(209, 250, 229, 0.8);
          border-color: rgba(16, 185, 129, 0.4);
          color: #047857;
        }
        @media (min-width: 1180px) {
          .ix-topbar-collapse { display: inline-flex; }
        }
        .ix-topbar-burger {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 9px;
          border: 1px solid rgba(16, 185, 129, 0.2);
          background: rgba(240, 253, 244, 0.7);
          color: #059669;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 160ms ease;
        }
        .ix-topbar-burger:hover {
          background: rgba(209, 250, 229, 0.8);
          border-color: rgba(16, 185, 129, 0.4);
          color: #047857;
        }
        @media (min-width: 1180px) {
          .ix-topbar-burger { display: none; }
        }
        .ix-topbar-brand {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          min-width: 0;
        }
        .ix-topbar-titles {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .ix-topbar-title {
          margin: 0;
          font-size: 1rem;
          line-height: 1.15;
          font-weight: 800;
          letter-spacing: -0.02em;
          background: linear-gradient(135deg, #065f46 0%, #059669 50%, #10b981 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .ix-topbar-subtitle {
          margin: 0.02rem 0 0;
          font-size: 0.68rem;
          line-height: 1.15;
          color: #64748b;
          font-weight: 500;
        }
        .ix-topbar-right {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          flex-shrink: 0;
        }
        .ix-topbar-icon-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 9px;
          border: 1px solid rgba(148, 163, 184, 0.2);
          background: rgba(255, 255, 255, 0.7);
          color: #64748b;
          cursor: pointer;
          transition: all 160ms ease;
          position: relative;
        }
        .ix-topbar-icon-btn:hover {
          background: rgba(209, 250, 229, 0.6);
          border-color: rgba(16, 185, 129, 0.35);
          color: #059669;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.1);
        }
        .ix-topbar-notif {
          position: relative;
        }
        .ix-notif-dot {
          position: absolute;
          top: 5px;
          right: 5px;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #ef4444;
          border: 1.5px solid #fff;
        }
        .ix-topbar-settings--open {
          background: rgba(209, 250, 229, 0.7) !important;
          border-color: rgba(16, 185, 129, 0.45) !important;
          color: #059669 !important;
        }

        .ix-settings-wrap {
          position: relative;
        }
        .ix-settings-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 240px;
          background: #fff;
          border: 1px solid rgba(16, 185, 129, 0.15);
          border-radius: 14px;
          box-shadow: 0 12px 40px rgba(5, 150, 105, 0.12), 0 4px 12px rgba(0,0,0,0.06);
          padding: 0.35rem;
          z-index: 100;
          animation: ix-dropdown-in 160ms ease;
        }
        .ix-settings-header {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          padding: 0.55rem 0.5rem;
        }
        .ix-settings-avatar {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: linear-gradient(135deg, #10b981, #059669);
          color: #fff;
          font-weight: 700;
          font-size: 0.85rem;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }
        .ix-settings-userinfo {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .ix-settings-username {
          font-size: 0.8rem;
          font-weight: 700;
          color: #0f172a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ix-settings-userrole {
          font-size: 0.65rem;
          color: #10b981;
          font-weight: 600;
          text-transform: capitalize;
        }
        .ix-settings-divider {
          height: 1px;
          background: rgba(148, 163, 184, 0.15);
          margin: 0.15rem 0.35rem;
        }
        .ix-settings-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.5rem 0.55rem;
          border: none;
          border-radius: 10px;
          background: transparent;
          color: #334155;
          font-size: 0.78rem;
          font-weight: 500;
          cursor: pointer;
          text-align: left;
          font-family: inherit;
          transition: all 140ms ease;
        }
        .ix-settings-item:hover:not(:disabled) {
          background: rgba(209, 250, 229, 0.5);
          color: #059669;
        }
        .ix-settings-item:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .ix-settings-item--logout {
          color: #dc2626;
        }
        .ix-settings-item--logout:hover:not(:disabled) {
          background: rgba(254, 226, 226, 0.5);
          color: #b91c1c;
        }

        @keyframes ix-dropdown-in {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .ix-shell {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.6rem;
          min-height: 0;
          flex: 1;
          padding: 0.32rem 0.32rem 0.32rem;
        }
        @media (min-width: 1180px) {
          .ix-shell {
            grid-template-columns: 228px minmax(0, 1fr);
            grid-template-rows: 1fr;
            align-items: stretch;
          }
          .ix-shell--collapsed {
            grid-template-columns: 56px minmax(0, 1fr);
          }
        }

        .ix-overlay {
          display: block;
          position: fixed;
          inset: 0;
          z-index: 199;
          background: rgba(15, 23, 42, 0.35);
          backdrop-filter: blur(4px);
          border: none;
          cursor: pointer;
          animation: ix-fade-in 200ms ease;
        }
        @media (min-width: 1180px) {
          .ix-overlay { display: none; }
        }

        .ix-sidebar {
          display: none;
        }
        @media (min-width: 1180px) {
          .ix-sidebar {
            display: flex;
            flex-direction: column;
            position: relative;
            align-self: stretch;
            min-height: 0;
            height: 100%;
            max-height: 100%;
            border-radius: 16px;
            border: 1px solid rgba(16, 185, 129, 0.15);
            background: linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(240,253,244,0.85) 100%);
            backdrop-filter: var(--ix-glass-blur);
            -webkit-backdrop-filter: var(--ix-glass-blur);
            box-shadow: 0 12px 40px rgba(5, 150, 105, 0.08), 0 2px 8px rgba(0,0,0,0.03);
            overflow: hidden;
            transition: width 200ms ease;
          }
        }
        @media (max-width: 1179px) {
          .ix-sidebar {
            display: flex;
            flex-direction: column;
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            z-index: 200;
            width: min(280px, 88vw);
            max-width: 280px;
            transform: translateX(-110%);
            transition: transform 200ms ease;
            border-radius: 0 16px 16px 0;
            border: 1px solid rgba(16, 185, 129, 0.15);
            border-left: none;
            background: rgba(255,255,255,0.97);
            box-shadow: 8px 0 40px rgba(5, 150, 105, 0.12);
          }
          .ix-sidebar--open {
            transform: translateX(0);
          }
        }
        .ix-sidebar--collapsed {
          width: 56px;
          min-width: 56px;
          max-width: 56px;
        }

        .ix-brand {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.38rem 0.48rem 0.42rem;
          border-bottom: 1px solid rgba(16, 185, 129, 0.12);
          background: linear-gradient(180deg, rgba(209, 250, 229, 0.5) 0%, rgba(255, 255, 255, 0.35) 100%);
          flex-shrink: 0;
        }
        .ix-sidebar--collapsed .ix-brand {
          flex-direction: column;
          align-items: center;
          padding: 0.5rem 0.25rem 0.4rem;
          gap: 0.35rem;
        }
        .ix-brand-mark {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          font-size: 0.85rem;
          display: grid;
          place-items: center;
          background: rgba(240, 253, 244, 0.5);
          flex-shrink: 0;
        }
        .ix-brand-text {
          display: flex;
          flex-direction: column;
          min-width: 0;
          line-height: 1.2;
        }
        .ix-brand-name {
          font-weight: 700;
          font-size: 0.84rem;
          color: #065f46;
          letter-spacing: -0.01em;
        }
        .ix-brand-user {
          font-size: 0.7rem;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 140px;
        }

        .ix-sidebar-close {
          display: none;
          position: absolute;
          top: 0.34rem;
          right: 0.34rem;
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(148, 163, 184, 0.2);
          color: #64748b;
          width: 28px;
          height: 28px;
          border-radius: 8px;
          cursor: pointer;
          place-items: center;
          z-index: 10;
          transition: background 140ms ease;
        }
        .ix-sidebar-close:hover { background: rgba(209, 250, 229, 0.7); }
        @media (max-width: 1179px) {
          .ix-sidebar-close { display: grid; }
        }

        .ix-nav {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 0.24rem 0.12rem;
          scrollbar-width: thin;
        }
        .ix-nav-group {
          display: flex;
          flex-direction: column;
          gap: 0.24rem;
          margin: 0 0.12rem;
          padding: 0.3rem 0.34rem 0.34rem;
          border-radius: 12px;
          border: 1px solid rgba(16, 185, 129, 0.1);
          background: rgba(255, 255, 255, 0.55);
          flex-shrink: 0;
        }
        .ix-section-label {
          padding: 0 0.52rem 0.02rem;
          color: #059669;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          opacity: 0.85;
        }
        .ix-sidebar--collapsed .ix-section-label,
        .ix-sidebar--collapsed .ix-nav-label {
          display: none;
        }

        .ix-nav-item {
          display: flex;
          width: 100%;
          align-items: center;
          gap: 0.4rem;
          padding: 0.45rem 0.48rem;
          min-height: 2.35rem;
          border: 1px solid rgba(148, 163, 184, 0.15);
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.85);
          color: #475569;
          font-size: 0.74rem;
          font-weight: 600;
          cursor: pointer;
          text-align: left;
          font-family: inherit;
          transition: all 160ms ease;
        }
        .ix-sidebar--collapsed .ix-nav-item {
          justify-content: center;
          padding: 0.45rem;
          min-height: 2.2rem;
        }
        .ix-nav-item:hover:not(.ix-nav-item--active):not(:disabled) {
          background: rgba(209, 250, 229, 0.6);
          border-color: rgba(16, 185, 129, 0.3);
          color: #047857;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.08);
        }
        .ix-nav-item--active {
          background: linear-gradient(135deg, rgba(209, 250, 229, 0.95) 0%, rgba(167, 243, 208, 0.5) 100%);
          border-color: rgba(16, 185, 129, 0.4);
          color: #065f46;
          box-shadow: 0 2px 10px rgba(16, 185, 129, 0.12);
        }
        .ix-nav-item--logout {
          color: #b91c1c;
        }
        .ix-nav-item--logout:hover:not(:disabled) {
          background: rgba(254, 226, 226, 0.5);
          border-color: rgba(239, 68, 68, 0.25);
          color: #b91c1c;
        }
        .ix-nav-item:disabled {
          opacity: 0.6;
          cursor: wait;
        }

        .ix-nav-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          min-width: 28px;
          min-height: 28px;
          border-radius: 8px;
          flex-shrink: 0;
        }
        .ix-nav-label {
          flex: 1;
          min-width: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .rowIconPurple { background: rgba(16, 185, 129, 0.15); color: #059669; }
        .rowIconViolet { background: rgba(5, 150, 105, 0.15); color: #047857; }
        .rowIconIndigo { background: rgba(52, 211, 153, 0.15); color: #0d9488; }
        .rowIconTeal   { background: rgba(20, 184, 166, 0.15); color: #0f766e; }
        .rowIconSlate  { background: rgba(148, 163, 184, 0.18); color: #475569; }
        .rowIconAmber  { background: rgba(245, 158, 11, 0.15); color: #a16207; }

        .ix-sidebar-footer {
          padding: 0.24rem 0.12rem 0.34rem;
          display: flex;
          flex-direction: column;
          gap: 0.24rem;
          margin: 0 0.12rem;
          border-top: 1px solid rgba(16, 185, 129, 0.1);
        }

        .ix-content {
          display: flex;
          flex-direction: column;
          min-height: 0;
          flex: 1;
          min-width: 0;
        }
        .ix-content-scroll {
          flex: 1;
          min-height: 0;
          overflow: auto;
          overscroll-behavior: contain;
          padding-right: 0.1rem;
          scrollbar-width: thin;
          display: flex;
          flex-direction: column;
        }

        @keyframes ix-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
