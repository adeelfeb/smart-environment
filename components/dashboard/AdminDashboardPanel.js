import React, { useState, useEffect } from 'react';
import { safeParseJsonResponse } from '../../utils/safeJsonResponse';

const KPI_CONFIG = [
  { key: 'total', label: 'Total Complaints', icon: '📋', color: '#02201a' },
  { key: 'pending', label: 'Pending', icon: '⏳', color: '#f59e0b' },
  { key: 'underReview', label: 'Under Review', icon: '🔍', color: '#3b82f6' },
  { key: 'workInProgress', label: 'Work in Progress', icon: '⚙️', color: '#f97316' },
  { key: 'resolved', label: 'Resolved', icon: '✅', color: '#10b981' },
  { key: 'rejected', label: 'Rejected', icon: '❌', color: '#ef4444' },
];

const CATEGORY_COLORS = [
  '#02201a', '#10b981', '#3b82f6', '#f59e0b', '#f97316',
  '#8b5cf6', '#ec4899', '#06b6d4', '#64748b',
];

export default function AdminDashboardPanel({ user, onNavigate }) {
  const [stats, setStats] = useState(null);
  const [complaintsByCategory, setComplaintsByCategory] = useState([]);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      setLoading(true);
      setError('');
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch('/api/complaints/stats', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      const data = await safeParseJsonResponse(res);
      if (data.success && data.data) {
        setStats(data.data.stats || {});
        setComplaintsByCategory(data.data.complaintsByCategory || []);
        setRecentComplaints((data.data.recentComplaints || []).slice(0, 5));
      } else {
        setError(data.message || 'Failed to load dashboard stats');
      }
    } catch (err) {
      setError('Unable to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const maxCategory = complaintsByCategory.reduce(
    (max, c) => Math.max(max, c.count || 0), 0
  );

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');

  const statusColor = (status) => {
    const map = {
      pending: '#f59e0b',
      underReview: '#3b82f6',
      workInProgress: '#f97316',
      resolved: '#10b981',
      rejected: '#ef4444',
    };
    return map[status] || '#64748b';
  };

  return (
    <div className="admin-dash">
      <header className="admin-dash-header">
        <div>
          <h2 className="admin-dash-title">Dashboard Overview</h2>
          <p className="admin-dash-sub">
            Welcome back{user?.name ? `, ${user.name}` : ''}
          </p>
        </div>
        <button className="admin-dash-refresh" onClick={fetchStats} disabled={loading}>
          ↻ Refresh
        </button>
      </header>

      {error && (
        <div className="admin-dash-alert">{error}</div>
      )}

      {loading ? (
        <div className="admin-dash-loading">
          <div className="admin-dash-spinner" />
          <span>Loading dashboard…</span>
        </div>
      ) : stats && (
        <>
          {/* KPI Cards */}
          <div className="admin-dash-kpi-grid">
            {KPI_CONFIG.map((kpi) => (
              <div key={kpi.key} className="admin-dash-kpi" style={{ borderLeftColor: kpi.color }}>
                <span className="admin-dash-kpi-icon" style={{ background: kpi.color + '18', color: kpi.color }}>
                  {kpi.icon}
                </span>
                <div className="admin-dash-kpi-body">
                  <span className="admin-dash-kpi-num" style={{ color: kpi.color }}>
                    {kpi.key === 'avgResolutionTime'
                      ? Number(stats[kpi.key] || 0).toFixed(1)
                      : (stats[kpi.key] ?? 0)}
                  </span>
                  <span className="admin-dash-kpi-label">{kpi.label}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Charts + Recent */}
          <div className="admin-dash-two-col">
            {/* Complaints by Category */}
            <section className="admin-dash-card">
              <h3 className="admin-dash-card-title">Complaints by Category</h3>
              {complaintsByCategory.length === 0 ? (
                <p className="admin-dash-empty">No category data available</p>
              ) : (
                <div className="admin-dash-bar-chart">
                  {complaintsByCategory.map((cat, i) => {
                    const pct = maxCategory > 0 ? ((cat.count || 0) / maxCategory) * 100 : 0;
                    return (
                      <div key={cat._id || i} className="admin-dash-bar-row">
                        <span className="admin-dash-bar-label" title={cat._id}>
                          {cat._id}
                        </span>
                        <div className="admin-dash-bar-track">
                          <div
                            className="admin-dash-bar-fill"
                            style={{
                              width: pct + '%',
                              background: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                            }}
                          />
                        </div>
                        <span className="admin-dash-bar-val">{cat.count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Recent Complaints */}
            <section className="admin-dash-card">
              <h3 className="admin-dash-card-title">Recent Complaints</h3>
              {recentComplaints.length === 0 ? (
                <p className="admin-dash-empty">No complaints yet</p>
              ) : (
                <ul className="admin-dash-recent-list">
                  {recentComplaints.map((c) => (
                    <li key={c._id} className="admin-dash-recent-item">
                      <div className="admin-dash-recent-info">
                        <span className="admin-dash-recent-title">{c.title || 'Untitled'}</span>
                        <span className="admin-dash-recent-meta">
                          {c.category || 'General'} · {formatDate(c.createdAt)}
                        </span>
                      </div>
                      <span
                        className="admin-dash-recent-status"
                        style={{ background: statusColor(c.status) + '20', color: statusColor(c.status) }}
                      >
                        {(c.status || 'pending').replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Quick Actions */}
          <section className="admin-dash-card admin-dash-actions">
            <h3 className="admin-dash-card-title">Quick Actions</h3>
            <div className="admin-dash-actions-row">
              {onNavigate && (
                <>
                  <button className="admin-dash-action-btn" onClick={() => onNavigate('complaints')}>
                    📄 View All Complaints
                  </button>
                  <button className="admin-dash-action-btn" onClick={() => onNavigate('map')}>
                    🗺️ View Map
                  </button>
                  <button className="admin-dash-action-btn" onClick={() => onNavigate('analytics')}>
                    📊 Analytics
                  </button>
                </>
              )}
            </div>
          </section>
        </>
      )}

      <style jsx>{`
        .admin-dash {
          padding: 24px;
          max-width: 1280px;
          margin: 0 auto;
        }
        .admin-dash-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
        }
        .admin-dash-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #02201a;
          margin: 0;
        }
        .admin-dash-sub {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 0.9rem;
        }
        .admin-dash-refresh {
          padding: 8px 18px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: #fff;
          color: #02201a;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }
        .admin-dash-refresh:hover { background: #f1f5f9; }
        .admin-dash-refresh:disabled { opacity: 0.5; cursor: not-allowed; }

        .admin-dash-alert {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 20px;
          font-size: 0.875rem;
        }

        .admin-dash-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          padding: 80px 0;
          color: #64748b;
        }
        .admin-dash-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #e2e8f0;
          border-top-color: #10b981;
          border-radius: 50%;
          animation: admin-dash-spin 0.8s linear infinite;
        }
        @keyframes admin-dash-spin {
          to { transform: rotate(360deg); }
        }

        /* KPI Grid */
        .admin-dash-kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 16px;
          margin-bottom: 28px;
        }
        .admin-dash-kpi {
          background: #fff;
          border-radius: 12px;
          border-left: 4px solid;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03);
          padding: 18px 16px;
          display: flex;
          align-items: center;
          gap: 14px;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .admin-dash-kpi:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        .admin-dash-kpi-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          flex-shrink: 0;
        }
        .admin-dash-kpi-body {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .admin-dash-kpi-num {
          font-size: 1.5rem;
          font-weight: 700;
          line-height: 1.2;
        }
        .admin-dash-kpi-label {
          font-size: 0.75rem;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Two-column layout */
        .admin-dash-two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 24px;
        }

        .admin-dash-card {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03);
          padding: 20px;
        }
        .admin-dash-card-title {
          font-size: 1rem;
          font-weight: 600;
          color: #02201a;
          margin: 0 0 16px;
        }
        .admin-dash-empty {
          color: #94a3b8;
          font-size: 0.85rem;
          text-align: center;
          padding: 32px 0;
        }

        /* Bar chart */
        .admin-dash-bar-chart {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .admin-dash-bar-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .admin-dash-bar-label {
          width: 120px;
          font-size: 0.8rem;
          color: #334155;
          text-align: right;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex-shrink: 0;
        }
        .admin-dash-bar-track {
          flex: 1;
          height: 22px;
          background: #f1f5f9;
          border-radius: 6px;
          overflow: hidden;
        }
        .admin-dash-bar-fill {
          height: 100%;
          border-radius: 6px;
          transition: width 0.4s ease;
          min-width: 2px;
        }
        .admin-dash-bar-val {
          width: 32px;
          font-size: 0.8rem;
          font-weight: 600;
          color: #02201a;
          text-align: right;
          flex-shrink: 0;
        }

        /* Recent list */
        .admin-dash-recent-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .admin-dash-recent-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #f1f5f9;
          gap: 12px;
        }
        .admin-dash-recent-item:last-child { border-bottom: none; }
        .admin-dash-recent-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .admin-dash-recent-title {
          font-size: 0.85rem;
          font-weight: 500;
          color: #02201a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .admin-dash-recent-meta {
          font-size: 0.75rem;
          color: #94a3b8;
          margin-top: 2px;
        }
        .admin-dash-recent-status {
          font-size: 0.7rem;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 99px;
          white-space: nowrap;
          flex-shrink: 0;
          text-transform: capitalize;
        }

        /* Quick Actions */
        .admin-dash-actions-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .admin-dash-action-btn {
          padding: 10px 20px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: #fff;
          color: #02201a;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s, transform 0.1s;
        }
        .admin-dash-action-btn:hover {
          background: #02201a;
          color: #fff;
          border-color: #02201a;
        }
        .admin-dash-action-btn:active { transform: scale(0.97); }

        @media (max-width: 768px) {
          .admin-dash { padding: 16px; }
          .admin-dash-kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .admin-dash-two-col {
            grid-template-columns: 1fr;
          }
          .admin-dash-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .admin-dash-bar-label { width: 80px; font-size: 0.7rem; }
        }
        @media (max-width: 480px) {
          .admin-dash-kpi-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
