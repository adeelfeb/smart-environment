import { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { safeParseJsonResponse } from '../utils/safeJsonResponse';
import DashboardLayout from '../components/DashboardLayout';
import SettingsPanel from '../components/dashboard/SettingsPanel';
import AddOrigin from '../components/dashboard/AddOrigin';
import UserOverviewTable from '../components/dashboard/UserOverviewTable';
import ApiEndpointsPanel from '../components/dashboard/ApiEndpointsPanel';
import BackupPanel from '../components/dashboard/BackupPanel';
import HelpPanel from '../components/dashboard/HelpPanel';
import PrivacyPanel from '../components/dashboard/PrivacyPanel';
import RequestsPanel from '../components/dashboard/RequestsPanel';
import ComplaintSubmitForm from '../components/dashboard/ComplaintSubmitForm';
import ComplaintHistory from '../components/dashboard/ComplaintHistory';
import ComplaintDetail from '../components/dashboard/ComplaintDetail';
import AdminDashboardPanel from '../components/dashboard/AdminDashboardPanel';
import AdminComplaintList from '../components/dashboard/AdminComplaintList';
import CorporationsPanel from '../components/dashboard/CorporationsPanel';
import CitizensManagement from '../components/dashboard/CitizensManagement';
import SystemSettingsPanel from '../components/dashboard/SystemSettingsPanel';
import AuditLogsPanel from '../components/dashboard/AuditLogsPanel';
import AnalyticsPanel from '../components/dashboard/AnalyticsPanel';
import GisMapPanel from '../components/dashboard/GisMapPanel';
import { getUserFromRequest } from '../lib/auth';

function serializeUser(user) {
  if (!user) return null;
  return {
    id: user._id?.toString?.() || user.id || null,
    name: user.name || '',
    email: user.email || '',
    role: user.role || 'base_user',
    roleRef: user.roleRef?.toString?.() || user.roleRef || null,
    createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
  };
}

export async function getServerSideProps(context) {
  try {
    const { req, resolvedUrl } = context;
    const user = await getUserFromRequest(req);

    if (!user) {
      // Don't include hash in redirect - it causes issues
      // The login page will handle redirecting back after auth
      return { redirect: { destination: '/login', permanent: false } };
    }

    const serializedUser = serializeUser(user);
    return { props: { user: serializedUser } };
  } catch (error) {
    // If auth fails (e.g., DB not available), redirect to login
    // This allows the app to work even without backend
    console.error('[Dashboard] Error in getServerSideProps:', error.message);
    return { redirect: { destination: '/login', permanent: false } };
  }
}

const NAVIGATION_BY_ROLE = {
  superadmin: [
    { key: 'admin-dashboard', label: 'Dashboard' },
    { key: 'complaints', label: 'Complaints' },
    { key: 'gis-map', label: 'GIS Map' },
    { key: 'analytics', label: 'Analytics' },
    { key: 'corporations', label: 'Corporations' },
    { key: 'citizen-management', label: 'Citizens' },
    { key: 'audit-logs', label: 'Audit Logs' },
    { key: 'system-settings', label: 'Settings' },
    { key: 'user-management', label: 'Users' },
    { key: 'backup', label: 'Backup' },
    { key: 'help', label: 'Help' },
  ],
  developer: [
    { key: 'admin-dashboard', label: 'Dashboard' },
    { key: 'complaints', label: 'Complaints' },
    { key: 'corporations', label: 'Corporations' },
    { key: 'user-management', label: 'Users' },
    { key: 'backup', label: 'Backup' },
    { key: 'help', label: 'Help' },
  ],
  admin: [
    { key: 'admin-dashboard', label: 'Dashboard' },
    { key: 'complaints', label: 'Complaints' },
    { key: 'gis-map', label: 'GIS Map' },
    { key: 'analytics', label: 'Analytics' },
    { key: 'help', label: 'Help' },
  ],
  citizen: [
    { key: 'submit-complaint', label: 'New Complaint' },
    { key: 'complaint-history', label: 'My Complaints' },
    { key: 'help', label: 'Help' },
  ],
  base_user: [
    { key: 'submit-complaint', label: 'New Complaint' },
    { key: 'complaint-history', label: 'My Complaints' },
    { key: 'help', label: 'Help' },
  ],
};

const FALLBACK_NAV = [
  { key: 'overview', label: 'Overview' },
  { key: 'updates', label: 'Updates' },
  { key: 'activity', label: 'Recent Activity' },
];

const SECTION_DESCRIPTORS = {
  'submit-complaint': {
    hideHeader: true,
    body: (user) => <ComplaintSubmitForm user={user} />,
  },
  'complaint-history': {
    hideHeader: true,
    body: (user) => <ComplaintHistoryWrapper user={user} />,
  },
  'complaint-detail': {
    hideHeader: true,
    body: () => null,
  },
  'admin-dashboard': {
    hideHeader: true,
    body: (user, onNavigate) => <AdminDashboardPanel user={user} onNavigate={onNavigate} />,
  },
  'complaints': {
    hideHeader: true,
    body: (user) => <ComplaintListWrapper user={user} />,
  },
  'corporations': {
    hideHeader: true,
    body: (user) => <CorporationsPanel user={user} />,
  },
  'citizen-management': {
    hideHeader: true,
    body: (user) => <CitizensManagement user={user} />,
  },
  'system-settings': {
    hideHeader: true,
    body: (user, onNavigate) => <SystemSettingsPanel user={user} onNavigate={onNavigate} />,
  },
  'audit-logs': {
    hideHeader: true,
    body: (user) => <AuditLogsPanel user={user} />,
  },
  'analytics': {
    hideHeader: true,
    body: (user) => <AnalyticsPanel user={user} />,
  },
  'gis-map': {
    hideHeader: true,
    body: (user) => <GisMapPanel user={user} />,
  },
  backup: {
    subtitle: 'Export all database collections to JSON or Excel. Import a backup file to add entries (invalid or duplicate rows are skipped).',
    hideHeader: true,
    body: (user) => <BackupPanel user={user} />,
  },
  help: {
    subtitle: 'Professional development services and support.',
    hideHeader: true,
    body: () => <HelpPanel />,
  },

  requests: {
    subtitle: 'View all help requests and contact form submissions.',
    hideHeader: true,
    body: () => <RequestsPanel />,
  },
  privacy: {
    subtitle: 'Privacy and confidentiality commitment.',
    hideHeader: true,
    body: () => <PrivacyPanel />,
  },
  'user-management': {
    subtitle: 'Manage access, roles, and permissions across your organization.',
    hideHeader: true,
    body: (user) => <UserOverviewTable currentUser={user} />,
  },
  'add-origin': {
    hideHeader: true,
    body: () => <AddOrigin />,
  },
  'api-endpoints': {
    hideHeader: true,
    body: () => <ApiEndpointsPanel />,
  },
};

function ComplaintHistoryWrapper({ user }) {
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  if (selectedComplaint) {
    return (
      <ComplaintDetail
        complaint={selectedComplaint}
        user={user}
        onBack={() => setSelectedComplaint(null)}
        onUpdated={() => setSelectedComplaint(null)}
      />
    );
  }
  return <ComplaintHistory user={user} onSelectComplaint={setSelectedComplaint} />;
}

function ComplaintListWrapper({ user }) {
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  if (selectedComplaint) {
    return (
      <ComplaintDetail
        complaint={selectedComplaint}
        user={user}
        onBack={() => setSelectedComplaint(null)}
        onUpdated={(updated) => {
          if (updated) setSelectedComplaint(updated);
          else setSelectedComplaint(null);
        }}
      />
    );
  }
  return <AdminComplaintList user={user} onSelectComplaint={setSelectedComplaint} />;
}

export default function Dashboard({ user }) {
  const [sessionUser, setSessionUser] = useState(user);
  const normalizedRole = (sessionUser?.role || '').toLowerCase();
  const navItems = NAVIGATION_BY_ROLE[normalizedRole] || FALLBACK_NAV;
  const router = useRouter();

  // Fetch and store token from cookies if not in localStorage
  useEffect(() => {
    const fetchToken = async () => {
      // Only fetch if token is not in localStorage
      if (typeof window !== 'undefined' && !localStorage.getItem('token')) {
        try {
          const response = await fetch('/api/auth/me', {
            method: 'GET',
            credentials: 'include',
          });
          if (response.ok) {
            const data = await safeParseJsonResponse(response);
            if (data.success && data.data?.token) {
              localStorage.setItem('token', data.data.token);
            }
          }
        } catch (error) {
          console.error('Failed to fetch token:', error);
        }
      }
    };
    fetchToken();
  }, []);

  const primaryNav = useMemo(() => navItems, [navItems]);
  
  const resolveSectionKey = useCallback(
    (key) => {
      if (!key) return null;
      const sanitized = `${key}`.trim();
      if (!sanitized) return null;
      const normalized = sanitized.toLowerCase();
      if (normalized === 'settings') {
        return 'settings';
      }
      const match = primaryNav.find((item) => item.key.toLowerCase() === normalized);
      return match?.key || null;
    },
    [primaryNav]
  );

  // Initialize activeSection - will be set properly by useEffect after mount
  const [activeSection, setActiveSection] = useState(() => {
    // Default to first nav item, hash will be processed in useEffect
    return navItems[0]?.key || FALLBACK_NAV[0].key;
  });
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const updateUrlHash = useCallback((key) => {
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has('section')) {
        url.searchParams.delete('section');
      }
      url.hash = key ? key : '';
      const next = `${url.pathname}${url.search}${url.hash}`;
      window.history.replaceState(null, '', next);
    } catch {
      const basePath = `${window.location.pathname}${window.location.search}`;
      const hashPart = key ? `#${key}` : '';
      window.history.replaceState(null, '', `${basePath}${hashPart}`);
    }
  }, []);

  const sectionParam = router.query?.section;

  useEffect(() => {
    if (!router.isReady) return;
    if (typeof sectionParam !== 'string') return;
    const resolvedKey = resolveSectionKey(sectionParam);
    if (!resolvedKey) return;
    setActiveSection((prev) => (prev === resolvedKey ? prev : resolvedKey));
    updateUrlHash(resolvedKey);
  }, [router.isReady, sectionParam, resolveSectionKey, updateUrlHash]);

  // Process hash on mount and when hash changes
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const applyHashToState = () => {
      let hashValue = window.location.hash.replace(/^#/, '');
      try {
        hashValue = decodeURIComponent(hashValue);
      } catch {
        // ignore decode errors and fall back to raw hash
      }
      if (hashValue) {
        const resolvedKey = resolveSectionKey(hashValue);
        if (resolvedKey) {
          setActiveSection((prev) => {
            // Only update if different to avoid unnecessary re-renders
            return prev === resolvedKey ? prev : resolvedKey;
          });
          // Update URL hash to ensure it's properly formatted
          updateUrlHash(resolvedKey);
          return;
        }
      }
      // If no valid hash, ensure we're showing the first nav item
      const firstNavKey = navItems[0]?.key || FALLBACK_NAV[0].key;
      setActiveSection((prev) => {
        return prev === firstNavKey ? prev : firstNavKey;
      });
    };

    // Apply hash on mount - use requestAnimationFrame to ensure DOM is ready
    const rafId = requestAnimationFrame(() => {
      applyHashToState();
    });
    
    window.addEventListener('hashchange', applyHashToState);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('hashchange', applyHashToState);
    };
  }, [resolveSectionKey, updateUrlHash, navItems]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!router.isReady) return;
    if (!activeSection) return;
    if (typeof sectionParam === 'string') return;
    if (window.location.hash) return;
    updateUrlHash(activeSection);
  }, [activeSection, router.isReady, sectionParam, updateUrlHash]);

  const handleSelectNav = useCallback(
    (key) => {
      setActiveSection(key);
      updateUrlHash(key);
    },
    [updateUrlHash]
  );

  const handleOpenSettings = useCallback(() => {
    setActiveSection('settings');
    updateUrlHash('settings');
  }, [updateUrlHash]);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm('Are you sure you want to log out?');
      if (!confirmed) return;
    }
    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      // Clear all auth-related storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        sessionStorage.removeItem('auth_redirect_count');
        sessionStorage.removeItem('auth_redirect_time');
      }
      await router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, router]);

  const activeNavItem = primaryNav.find((item) => item.key === activeSection);
  const sectionDescriptor = SECTION_DESCRIPTORS[activeSection] || {
    subtitle: 'This area will be available soon.',
    panels: [
      {
        title: 'In progress',
        description: 'Content for this section is being prepared.',
      },
    ],
  };

  const hideHeader = Boolean(sectionDescriptor.hideHeader);

  const panels = sectionDescriptor.panels || [];
  const list = sectionDescriptor.list || [];
  const hasCustomBody = typeof sectionDescriptor.body === 'function';
  const sectionTitle = activeSection === 'settings' ? 'Settings' : activeNavItem?.label || 'Dashboard';
  const sectionSubtitle =
    activeSection === 'settings'
      ? 'Manage your personal details and keep your account secure.'
      : typeof sectionDescriptor.subtitle === 'function'
        ? sectionDescriptor.subtitle(sessionUser)
        : sectionDescriptor.subtitle;

  useEffect(() => {
    if (!primaryNav.length) return;
    const hasActive = primaryNav.some((item) => item.key === activeSection);
    const isSettings = activeSection === 'settings';
    if (!hasActive && !isSettings) {
      const fallbackKey = primaryNav[0].key;
      setActiveSection(fallbackKey);
      updateUrlHash(fallbackKey);
    }
  }, [primaryNav, activeSection, updateUrlHash]);

  // Ensure sectionTitle is always a string to prevent React warnings
  const safeSectionTitle = typeof sectionTitle === 'string' ? sectionTitle : (Array.isArray(sectionTitle) ? sectionTitle.join(' ') : String(sectionTitle || 'Dashboard'));
  const pageTitle = `${safeSectionTitle} | EcoWatch Dashboard`;

  return (
    <>
      <Head>
        <title>{String(pageTitle)}</title>
      </Head>
      <DashboardLayout
        user={sessionUser}
        navItems={primaryNav}
        activeNav={activeSection}
        onNavSelect={handleSelectNav}
        onOpenSettings={handleOpenSettings}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
      >
        <section className="section">
          {!hideHeader && (
            <header className="section-header">
              <h1 className="section-title">{sectionTitle}</h1>
              {sectionSubtitle && <p className="section-subtitle">{sectionSubtitle}</p>}
            </header>
          )}
          <div className="section-body">
            {activeSection === 'settings' ? (
              <SettingsPanel
                user={sessionUser}
                onProfileUpdated={(updated) => updated && setSessionUser(updated)}
              />
            ) : (
              <>
                {panels.length > 0 && (
                  <div className="section-panels">
                    {panels.map((panel) => (
                      <article className="section-card" key={panel.title}>
                        <div className="section-card-header">
                          <h2>{panel.title}</h2>
                          {panel.meta && <span className="section-meta">{panel.meta}</span>}
                        </div>
                        <p>{panel.description}</p>
                      </article>
                    ))}
                  </div>
                )}

                {list.length > 0 && (
                  <div className="section-list-wrap">
                    <h3 className="section-list-title">{sectionDescriptor.listTitle || 'Key actions'}</h3>
                    <ul className="section-list">
                      {list.map((item) => {
                        const id = typeof item === 'string' ? item : item.title;
                        const content = typeof item === 'string' ? { title: item } : item;
                        return (
                          <li key={id} className="section-list-item">
                            <span className="section-list-item-title">{content.title}</span>
                            {content.description && <p>{content.description}</p>}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {hasCustomBody && (
                  <div className="section-custom">{sectionDescriptor.body(sessionUser, handleSelectNav)}</div>
                )}

                {panels.length === 0 && list.length === 0 && !hasCustomBody && (
                  <div className="empty-state">
                    <h2>Stay tuned</h2>
                    <p>We’re preparing something great for this section.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <style jsx>{`
          .section {
            display: grid;
            gap: 1rem;
            min-height: 100%;
            margin: 0;
            padding: 0;
          }

          .section-header {
            display: grid;
            gap: 0.5rem;
            margin: 0;
            padding: 0;
          }

          .section-title {
            font-family: var(--font-heading);
            font-size: clamp(1.9rem, 3.5vw, 2.35rem);
            font-weight: 600;
            color: #02201a;
            margin: 0;
            padding: 0;
          }

          .section-subtitle {
            color: #4b5563;
            font-size: 1rem;
            line-height: 1.6;
            max-width: 60ch;
            margin: 0;
            padding: 0;
          }

          .section-body {
            display: grid;
            gap: 1.2rem;
            padding-bottom: 0.35rem;
          }

          .section-panels {
            display: grid;
            gap: 1.25rem;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          }

          .section-card {
            border-radius: 1rem;
            background: white;
            padding: 1.6rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 8px 24px rgba(0, 0, 0, 0.04);
            border: 1px solid #f3f4f6;
            display: grid;
            gap: 0.75rem;
          }

          .section-card-header {
            display: flex;
            align-items: baseline;
            gap: 0.75rem;
            justify-content: space-between;
          }

          .section-card h2 {
            font-family: var(--font-subheading);
            font-size: 1.1rem;
            font-weight: 600;
            color: #02201a;
          }

          .section-card p {
            color: #6b7280;
            line-height: 1.65;
          }

          .section-meta {
            font-size: 0.82rem;
            font-weight: 600;
            color: #059669;
            background: rgba(5, 150, 105, 0.08);
            padding: 0.35rem 0.65rem;
            border-radius: 999px;
          }

          .section-list-wrap {
            display: grid;
            gap: 0.75rem;
            background: white;
            border-radius: 1rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 8px 24px rgba(0, 0, 0, 0.04);
            border: 1px solid #f3f4f6;
            padding: 1.6rem;
          }

          .section-list-title {
            font-family: var(--font-subheading);
            font-size: 1rem;
            font-weight: 600;
            color: #02201a;
          }

          .section-list {
            list-style: none;
            display: grid;
            gap: 0.85rem;
            margin: 0;
            padding: 0;
          }

          .section-list-item {
            display: grid;
            gap: 0.3rem;
            padding-left: 0.2rem;
          }

          .section-list-item-title {
            font-weight: 500;
            color: #02201a;
          }

          .section-list-item p {
            color: #6b7280;
            line-height: 1.6;
          }

          .section-custom {
            background: white;
            border-radius: 1rem;
            padding: 1.6rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 8px 24px rgba(0, 0, 0, 0.04);
            border: 1px solid #f3f4f6;
          }

          .empty-state {
            display: grid;
            gap: 0.5rem;
            text-align: center;
            background: white;
            border-radius: 1rem;
            padding: 2rem;
            border: 1px solid #f3f4f6;
          }

          .empty-state h2 {
            font-size: 1.1rem;
            font-weight: 600;
            color: #02201a;
          }

          .empty-state p {
            color: #6b7280;
          }

          @media (max-width: 960px) {
            .section-title {
              font-size: clamp(1.5rem, 4vw, 1.9rem);
            }
            .section-subtitle {
              font-size: 0.95rem;
              max-width: 100%;
            }
          }

          @media (max-width: 720px) {
            .section {
              gap: 1.5rem;
            }
            .section-body {
              gap: 1.25rem;
              padding-bottom: 0.75rem;
            }

            .section-panels {
              grid-template-columns: 1fr;
              gap: 1rem;
            }

            .section-card {
              padding: 1.25rem;
            }

            .section-card h2 {
              font-size: 1rem;
            }

            .section-list-wrap {
              padding: 1.25rem;
            }

            .section-list-title {
              font-size: 0.95rem;
            }

            .section-custom {
              padding: 1.25rem;
            }

            .empty-state {
              padding: 1.5rem;
            }
          }

          @media (max-width: 480px) {
            .section-header {
              gap: 0.4rem;
            }
            .section-title {
              font-size: 1.5rem;
            }
            .section-subtitle {
              font-size: 0.9rem;
            }
            .section-body {
              gap: 1rem;
            }
            .section-card {
              padding: 1rem;
              border-radius: 0.9rem;
            }
            .section-list-wrap {
              padding: 1rem;
              border-radius: 0.9rem;
            }
            .section-custom {
              padding: 1rem;
              border-radius: 0.9rem;
            }
          }
        `}</style>
      </DashboardLayout>
    </>
  );
}
