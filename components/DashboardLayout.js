import { useState, useEffect, useRef, useCallback } from 'react';

const SIDEBAR_COLLAPSE_KEY = 'ix-sidebar-collapsed';

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
  const sidebarRef = useRef(null);
  const displayName = user?.name || 'User';
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
          {/* Mobile burger */}
          <button className="ix-topbar-burger" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="ix-topbar-titles">
            <h1 className="ix-topbar-title">EcoWatch</h1>
            <p className="ix-topbar-subtitle">{displayName}</p>
          </div>
        </div>
        <div className="ix-topbar-right">
          <button className="ix-topbar-icon-btn" aria-label="Notifications">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </button>
          <button
            className="ix-topbar-icon-btn"
            onClick={onOpenSettings}
            aria-label="Settings"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"></path>
            </svg>
          </button>
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M8 38C8 38 6 14 24 8C24 8 26 32 8 38Z" fill="#fff" opacity="0.9" transform="translate(0,-12) scale(0.85)"/>
              </svg>
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
        /* ── Page ── */
        .ix-page {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          color: var(--ix-text);
          font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Inter, sans-serif;
          background-color: var(--ix-bg-mist);
          background-image:
            radial-gradient(ellipse 110% 70% at 100% -15%, rgba(59, 130, 246, 0.15), transparent 52%),
            radial-gradient(ellipse 85% 55% at 0% 5%, rgba(37, 99, 235, 0.1), transparent 48%),
            radial-gradient(ellipse 75% 45% at 55% 105%, rgba(96, 165, 250, 0.08), transparent 50%),
            linear-gradient(168deg, var(--ix-bg-soft) 0%, var(--ix-bg-mist) 36%, var(--ix-bg-cloud) 68%, var(--ix-bg-horizon) 100%);
        }

        @media (min-width: 1100px) {
          .ix-page {
            height: 100dvh;
            max-height: 100dvh;
            overflow: hidden;
          }
        }

        /* ── TopBar ── */
        .ix-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.6rem;
          padding: 0.22rem 0.48rem;
          margin: 0.32rem 0.32rem 0;
          min-height: 0;
          flex-shrink: 0;
          background: var(--ix-surface);
          backdrop-filter: var(--ix-glass-blur);
          -webkit-backdrop-filter: var(--ix-glass-blur);
          border: 1px solid var(--ix-surface-border);
          border-radius: 12px;
          box-shadow: var(--ix-surface-shadow);
          z-index: 50;
        }
        .ix-topbar-left {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          min-width: 0;
        }
        .ix-topbar-collapse {
          display: none;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 8px;
          border: 1px solid var(--ix-surface-border-soft);
          background: var(--ix-surface-solid);
          color: var(--ix-muted);
          cursor: pointer;
          flex-shrink: 0;
          transition: border-color 140ms ease, color 140ms ease;
        }
        .ix-topbar-collapse:hover {
          border-color: rgba(59, 130, 246, 0.4);
          color: var(--ix-accent-deep);
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
          border-radius: 8px;
          border: 1px solid var(--ix-surface-border-soft);
          background: var(--ix-surface-solid);
          color: var(--ix-muted);
          cursor: pointer;
          flex-shrink: 0;
          transition: border-color 140ms ease, color 140ms ease;
        }
        .ix-topbar-burger:hover {
          border-color: rgba(59, 130, 246, 0.4);
          color: var(--ix-accent-deep);
        }
        @media (min-width: 1180px) {
          .ix-topbar-burger { display: none; }
        }
        .ix-topbar-titles {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .ix-topbar-title {
          margin: 0;
          font-size: 0.95rem;
          line-height: 1.15;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--ix-text);
        }
        .ix-topbar-subtitle {
          margin: 0.02rem 0 0;
          font-size: 0.7rem;
          line-height: 1.15;
          color: var(--ix-muted);
        }
        .ix-topbar-right {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          flex-shrink: 0;
        }
        .ix-topbar-icon-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 8px;
          border: 1px solid var(--ix-surface-border-soft);
          background: transparent;
          color: var(--ix-muted);
          cursor: pointer;
          transition: border-color 140ms ease, color 140ms ease, background 140ms ease;
        }
        .ix-topbar-icon-btn:hover {
          background: rgba(219, 234, 254, 0.55);
          border-color: rgba(59, 130, 246, 0.4);
          color: var(--ix-accent-deep);
        }

        /* ── Shell Grid ── */
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

        /* ── Overlay ── */
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

        /* ── Sidebar ── */
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
            border: 1px solid var(--ix-surface-border);
            background: var(--ix-surface);
            backdrop-filter: var(--ix-glass-blur);
            -webkit-backdrop-filter: var(--ix-glass-blur);
            box-shadow: var(--ix-surface-shadow-lg);
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
            border: 1px solid var(--ix-surface-border);
            border-left: none;
            background: var(--ix-surface-solid);
            box-shadow: 8px 0 40px rgba(37, 99, 235, 0.14);
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

        /* ── Brand ── */
        .ix-brand {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.34rem 0.48rem 0.38rem;
          border-bottom: 1px solid var(--ix-surface-border-soft);
          background: linear-gradient(180deg, rgba(219, 234, 254, 0.65) 0%, rgba(255, 255, 255, 0.35) 100%);
          flex-shrink: 0;
        }
        .ix-sidebar--collapsed .ix-brand {
          flex-direction: column;
          align-items: center;
          padding: 0.5rem 0.25rem 0.4rem;
          gap: 0.35rem;
        }
        .ix-brand-mark {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          font-size: 0.85rem;
          display: grid;
          place-items: center;
          background: linear-gradient(145deg, #3b82f6 0%, #2563eb 45%, #1d4ed8 100%);
          color: #fff;
          font-weight: 800;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
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
          font-size: 0.82rem;
          color: var(--ix-text);
          letter-spacing: -0.01em;
        }
        .ix-brand-user {
          font-size: 0.7rem;
          color: var(--ix-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 140px;
        }

        /* ── Sidebar close (mobile) ── */
        .ix-sidebar-close {
          display: none;
          position: absolute;
          top: 0.34rem;
          right: 0.34rem;
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid var(--ix-surface-border-soft);
          color: var(--ix-muted);
          width: 28px;
          height: 28px;
          border-radius: 8px;
          cursor: pointer;
          place-items: center;
          z-index: 10;
          transition: background 140ms ease;
        }
        .ix-sidebar-close:hover { background: rgba(219, 234, 254, 0.7); }
        @media (max-width: 1179px) {
          .ix-sidebar-close { display: grid; }
        }

        /* ── Nav ── */
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
          border-radius: 10px;
          border: 1px solid var(--ix-surface-border-soft);
          background: rgba(255, 255, 255, 0.45);
          flex-shrink: 0;
        }
        .ix-section-label {
          padding: 0 0.52rem 0.02rem;
          color: var(--ix-accent-deep);
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

        /* ── Nav Item ── */
        .ix-nav-item {
          display: flex;
          width: 100%;
          align-items: center;
          gap: 0.4rem;
          padding: 0.45rem 0.48rem;
          min-height: 2.35rem;
          border: 1px solid var(--ix-surface-border-soft);
          border-radius: 10px;
          background: var(--ix-surface-solid);
          color: #475569;
          font-size: 0.74rem;
          font-weight: 600;
          cursor: pointer;
          text-align: left;
          font-family: inherit;
          transition: border-color 140ms ease, background-color 140ms ease, color 140ms ease, box-shadow 140ms ease;
        }
        .ix-sidebar--collapsed .ix-nav-item {
          justify-content: center;
          padding: 0.45rem;
          min-height: 2.2rem;
        }
        .ix-nav-item:hover:not(.ix-nav-item--active):not(:disabled) {
          background: rgba(219, 234, 254, 0.75);
          border-color: rgba(59, 130, 246, 0.4);
          color: var(--ix-accent-deep);
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.08);
        }
        .ix-nav-item--active {
          background: linear-gradient(135deg, rgba(219, 234, 254, 0.98) 0%, rgba(191, 219, 254, 0.55) 100%);
          border-color: rgba(59, 130, 246, 0.45);
          color: var(--ix-accent-deep);
          box-shadow: 0 2px 10px rgba(37, 99, 235, 0.12);
        }
        .ix-nav-item--logout {
          color: #b91c1c;
        }
        .ix-nav-item--logout:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.08);
          border-color: rgba(239, 68, 68, 0.3);
          color: #b91c1c;
        }
        .ix-nav-item:disabled {
          opacity: 0.6;
          cursor: wait;
        }

        /* ── Nav Icon ── */
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

        /* Icon color variants */
        .rowIconPurple { background: rgba(96, 165, 250, 0.18); color: #2563eb; }
        .rowIconViolet { background: rgba(59, 130, 246, 0.18); color: #1d4ed8; }
        .rowIconIndigo { background: rgba(99, 102, 241, 0.18); color: #4338ca; }
        .rowIconTeal   { background: rgba(20, 184, 166, 0.18); color: #0f766e; }
        .rowIconSlate  { background: rgba(148, 163, 184, 0.2);  color: #475569; }
        .rowIconAmber  { background: rgba(245, 158, 11, 0.2);   color: #a16207; }

        /* ── Sidebar Footer ── */
        .ix-sidebar-footer {
          padding: 0.24rem 0.12rem 0.34rem;
          display: flex;
          flex-direction: column;
          gap: 0.24rem;
          margin: 0 0.12rem;
          border-top: 1px solid var(--ix-surface-border-soft);
        }

        /* ── Content ── */
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

        /* ── Animations ── */
        @keyframes ix-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
