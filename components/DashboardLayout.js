import { useState, useEffect, useRef } from 'react';

const getNavIcon = (key) => {
  const icons = {
    'admin-dashboard': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
      </svg>
    ),
    'submit-complaint': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="16"></line>
        <line x1="8" y1="12" x2="16" y2="12"></line>
      </svg>
    ),
    'complaint-history': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
      </svg>
    ),
    'complaints': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
      </svg>
    ),
    'gis-map': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
        <line x1="8" y1="2" x2="8" y2="18"></line>
        <line x1="16" y1="6" x2="16" y2="22"></line>
      </svg>
    ),
    'analytics': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"></line>
        <line x1="12" y1="20" x2="12" y2="4"></line>
        <line x1="6" y1="20" x2="6" y2="14"></line>
      </svg>
    ),
    'corporations': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18"></path>
        <path d="M5 21V7l8-4v18"></path>
        <path d="M19 21V11l-6-4"></path>
        <path d="M9 9v.01"></path>
        <path d="M9 12v.01"></path>
        <path d="M9 15v.01"></path>
      </svg>
    ),
    'citizen-management': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    ),
    'audit-logs': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"></path>
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
      </svg>
    ),
    'system-settings': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"></path>
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
    'help': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
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
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);
  const displayName = user?.name || 'User';
  const items = Array.isArray(navItems) ? navItems : [];

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
    <div className="shell">
      {/* Mobile top bar */}
      <header className="topbar">
        <button className="topbar-burger" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <div className="topbar-brand">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M8 38C8 38 6 14 24 8C24 8 26 32 8 38Z" fill="#10b981" opacity="0.9" transform="translate(0,-12) scale(0.85)"/></svg>
          <span>EcoWatch</span>
        </div>
        <div className="topbar-spacer" />
      </header>

      {/* Overlay */}
      {sidebarOpen && <div className="overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'is-open' : ''}`} ref={sidebarRef}>
        <div className="sidebar-head">
          <div className="brand">
            <div className="brand-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M8 38C8 38 6 14 24 8C24 8 26 32 8 38Z" fill="#10b981" opacity="0.9" transform="translate(0,-12) scale(0.85)"/><circle cx="17" cy="15" r="4" stroke="#047857" strokeWidth="1.5" fill="white" fillOpacity="0.4"/><line x1="20" y1="18" x2="22" y2="20" stroke="#047857" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <div className="brand-text">
              <span className="brand-name"><span className="eco">Eco</span>Watch</span>
              <span className="brand-user">{displayName}</span>
            </div>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {items.map((item) => {
              const active = item.key === activeNav;
              return (
                <li key={item.key}>
                  <button
                    className={`nav-btn ${active ? 'active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => { onNavSelect?.(item.key); setSidebarOpen(false); }}
                  >
                    <span className="nav-ico">{getNavIcon(item.key)}</span>
                    <span className="nav-lbl">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="sidebar-foot">
          <button
            className={`foot-btn ${activeNav === 'settings' ? 'active' : ''}`}
            onClick={() => { onOpenSettings?.(); setSidebarOpen(false); }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/></svg>
            <span>Settings</span>
          </button>
          <button className="foot-btn logout" onClick={onLogout} disabled={isLoggingOut}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="content">
        <div className="content-scroll">{children}</div>
      </main>

      <style jsx>{`
        .shell {
          height: 100vh;
          height: 100dvh;
          display: flex;
          background: #f8fafc;
          color: #0f172a;
          overflow: hidden;
        }

        /* ── Top bar (mobile) ── */
        .topbar {
          display: none;
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 56px;
          background: #02201a;
          color: #fff;
          align-items: center;
          padding: 0 16px;
          gap: 12px;
          z-index: 900;
          box-shadow: 0 2px 8px rgba(0,0,0,.15);
        }
        .topbar-burger {
          background: none; border: none; color: #fff; cursor: pointer;
          width: 40px; height: 40px; display: grid; place-items: center;
          border-radius: 10px; transition: background .15s;
          flex-shrink: 0;
        }
        .topbar-burger:hover { background: rgba(255,255,255,.1); }
        .topbar-brand {
          display: flex; align-items: center; gap: 8px;
          font-weight: 700; font-size: .95rem; letter-spacing: .02em;
        }
        .topbar-spacer { flex: 1; }

        /* ── Overlay ── */
        .overlay {
          display: none;
          position: fixed; inset: 0;
          background: rgba(0,0,0,.45);
          z-index: 998;
          backdrop-filter: blur(2px);
          -webkit-backdrop-filter: blur(2px);
          animation: fade-in .2s ease;
        }

        /* ── Sidebar ── */
        .sidebar {
          width: min(240px, 22vw);
          background: linear-gradient(180deg, #02201a 0%, #064e3b 50%, #047857 100%);
          color: #d1fae5;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          height: 100%;
          border-right: 1px solid rgba(16,185,129,.12);
          position: relative;
          z-index: 10;
        }

        .sidebar-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 16px 12px;
          border-bottom: 1px solid rgba(16,185,129,.1);
        }
        .sidebar-close {
          display: none;
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.1);
          color: #d1fae5;
          width: 32px; height: 32px;
          border-radius: 8px;
          cursor: pointer;
          place-items: center;
          transition: background .15s;
        }
        .sidebar-close:hover { background: rgba(255,255,255,.15); }

        .brand { display: flex; align-items: center; gap: 10px; }
        .brand-icon {
          width: 36px; height: 36px; border-radius: 10px;
          background: rgba(16,185,129,.15);
          display: grid; place-items: center;
          border: 1px solid rgba(16,185,129,.2);
          flex-shrink: 0;
        }
        .brand-text { display: flex; flex-direction: column; line-height: 1.2; }
        .brand-name { font-weight: 700; font-size: .9rem; letter-spacing: .02em; }
        .brand-name .eco { color: #34d399; }
        .brand-user {
          font-size: .7rem; color: rgba(209,250,229,.65);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          max-width: 140px;
        }

        /* ── Nav ── */
        .sidebar-nav {
          flex: 1;
          overflow-y: auto;
          padding: 12px 12px 8px;
        }
        .sidebar-nav ul {
          list-style: none; margin: 0; padding: 0;
          display: flex; flex-direction: column; gap: 2px;
        }
        .nav-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid transparent;
          background: transparent;
          color: #d1fae5;
          font-size: .82rem;
          font-weight: 500;
          cursor: pointer;
          transition: all .15s ease;
          text-align: left;
          position: relative;
        }
        .nav-btn:hover {
          background: rgba(255,255,255,.08);
          color: #fff;
        }
        .nav-btn.active {
          background: rgba(16,185,129,.2);
          border-color: rgba(52,211,153,.35);
          color: #fff;
          font-weight: 600;
        }
        .nav-btn.active::before {
          content: '';
          position: absolute;
          left: 0; top: 50%; transform: translateY(-50%);
          width: 3px; height: 50%;
          background: #34d399;
          border-radius: 0 3px 3px 0;
        }
        .nav-ico {
          display: grid; place-items: center;
          width: 20px; height: 20px;
          flex-shrink: 0;
          opacity: .75;
          transition: opacity .15s, transform .15s;
        }
        .nav-btn:hover .nav-ico, .nav-btn.active .nav-ico {
          opacity: 1; transform: scale(1.08);
        }
        .nav-lbl {
          text-transform: uppercase;
          letter-spacing: .04em;
          font-size: .78rem;
          font-weight: 600;
        }

        /* ── Footer ── */
        .sidebar-foot {
          padding: 8px 12px 16px;
          display: flex; flex-direction: column; gap: 4px;
          border-top: 1px solid rgba(16,185,129,.1);
        }
        .foot-btn {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 12px;
          border-radius: 8px;
          border: 1px solid transparent;
          background: transparent;
          color: #d1fae5;
          font-size: .78rem;
          font-weight: 600;
          cursor: pointer;
          transition: all .15s;
          text-transform: uppercase;
          letter-spacing: .04em;
          text-align: left;
        }
        .foot-btn:hover { background: rgba(255,255,255,.08); color: #fff; }
        .foot-btn.active { background: rgba(16,185,129,.2); border-color: rgba(52,211,153,.35); color: #fff; }
        .foot-btn.logout {
          color: #fca5a5;
          border-color: rgba(239,68,68,.15);
        }
        .foot-btn.logout:hover {
          background: rgba(239,68,68,.15);
          color: #fff;
        }
        .foot-btn:disabled { opacity: .6; cursor: wait; }

        /* ── Content ── */
        .content {
          flex: 1;
          display: flex;
          min-width: 0;
          min-height: 0;
        }
        .content-scroll {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 28px 32px 32px;
          overflow-y: auto;
          overflow-x: hidden;
          gap: 1.5rem;
          -webkit-overflow-scrolling: touch;
        }

        /* ── Responsive: tablet ── */
        @media (max-width: 1024px) {
          .content-scroll { padding: 24px 20px 28px; }
        }

        /* ── Responsive: mobile ── */
        @media (max-width: 768px) {
          .topbar { display: flex; }
          .overlay { display: block; }
          .sidebar-close { display: grid; }

          .sidebar {
            position: fixed;
            top: 0; left: 0;
            width: min(280px, 85vw);
            height: 100vh;
            height: 100dvh;
            z-index: 999;
            transform: translateX(-100%);
            transition: transform .25s cubic-bezier(.4,0,.2,1);
            box-shadow: none;
          }
          .sidebar.is-open {
            transform: translateX(0);
            box-shadow: 4px 0 24px rgba(0,0,0,.2);
          }

          .sidebar-head { padding: 16px; }
          .sidebar-nav { padding: 8px 12px; }
          .sidebar-foot { padding: 8px 12px 20px; }

          .content-scroll {
            padding: 72px 16px 24px;
          }
        }

        /* ── Responsive: small phone ── */
        @media (max-width: 400px) {
          .content-scroll {
            padding: 64px 12px 20px;
          }
          .nav-btn { padding: 9px 10px; }
          .nav-lbl { font-size: .74rem; }
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
