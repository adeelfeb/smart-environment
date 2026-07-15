import React, { useState, useEffect } from 'react';
import { safeParseJsonResponse } from '../../utils/safeJsonResponse';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  CartesianGrid,
} from 'recharts';
import {
  Activity, Clock, AlertTriangle, Loader, CheckCircle, XCircle,
  FileText, Map, BarChart3, RefreshCw, ChevronRight,
  ArrowUpRight, Calendar, TrendingUp,
} from 'lucide-react';

const KPI_CONFIG = [
  { key: 'total', label: 'Total Complaints', color: '#02201a', bg: 'linear-gradient(135deg, #02201a, #1a5c44)', icon: 'total' },
  { key: 'pending', label: 'Pending', color: '#f59e0b', bg: 'linear-gradient(135deg, #f59e0b, #fbbf24)', icon: 'pending' },
  { key: 'underReview', label: 'Under Review', color: '#3b82f6', bg: 'linear-gradient(135deg, #3b82f6, #60a5fa)', icon: 'underReview' },
  { key: 'workInProgress', label: 'Work in Progress', color: '#f97316', bg: 'linear-gradient(135deg, #f97316, #fb923c)', icon: 'workInProgress' },
  { key: 'resolved', label: 'Resolved', color: '#10b981', bg: 'linear-gradient(135deg, #10b981, #34d399)', icon: 'resolved' },
  { key: 'rejected', label: 'Rejected', color: '#ef4444', bg: 'linear-gradient(135deg, #ef4444, #f87171)', icon: 'rejected' },
];

const KPI_ICONS = {
  total: <FileText size={20} />,
  pending: <Clock size={20} />,
  underReview: <AlertTriangle size={20} />,
  workInProgress: <Loader size={20} />,
  resolved: <CheckCircle size={20} />,
  rejected: <XCircle size={20} />,
};

const CATEGORY_COLORS = [
  '#02201a', '#10b981', '#3b82f6', '#f59e0b', '#f97316',
  '#8b5cf6', '#ec4899', '#06b6d4', '#64748b',
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: 'rgba(255,255,255,0.98)',
      border: '1px solid #e2e8f0',
      borderRadius: '10px',
      padding: '10px 14px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
      fontSize: '0.8rem',
    }}>
      <p style={{ margin: 0, color: '#02201a', fontWeight: 600 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: '4px 0 0', color: p.color || '#64748b' }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

export default function AdminDashboardPanel({ user, onNavigate }) {
  const [stats, setStats] = useState(null);
  const [complaintsByCategory, setComplaintsByCategory] = useState([]);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [dailyTrend, setDailyTrend] = useState([]);
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
        setDailyTrend(data.data.dailyTrend || []);
      } else {
        setError(data.message || 'Failed to load dashboard stats');
      }
    } catch {
      setError('Unable to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const chartData = complaintsByCategory.map((cat, i) => ({
    name: cat._id || 'Unknown',
    count: cat.count || 0,
    fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  const trendData = dailyTrend.map(d => ({
    date: (() => {
      if (!d._id) return '';
      const dt = new Date(d._id);
      return `${dt.toLocaleString('default', { month: 'short' })} ${dt.getDate()}`;
    })(),
    count: d.count || 0,
  }));

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : '---');

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
      {/* Header */}
      <header className="admin-dash-header">
        <div className="admin-dash-header-left">
          <div className="admin-dash-header-icon">
            <Activity size={22} />
          </div>
          <div>
            <h2 className="admin-dash-title">Dashboard Overview</h2>
            <p className="admin-dash-sub">
              Welcome back{user?.name ? `, ${user.name}` : ''}
              <span className="admin-dash-date">
                <Calendar size={12} />
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </p>
          </div>
        </div>
        <button className="admin-dash-refresh" onClick={fetchStats} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spinning' : ''} />
          Refresh
        </button>
      </header>

      {error && (
        <div className="admin-dash-alert">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="admin-dash-loading">
          <div className="admin-dash-spinner" />
          <span>Loading dashboard...</span>
        </div>
      ) : stats && (
        <>
          {/* KPI Cards */}
          <div className="admin-dash-kpi-grid">
            {KPI_CONFIG.map((kpi) => (
              <div key={kpi.key} className="admin-dash-kpi">
                <div className="admin-dash-kpi-icon" style={{ background: kpi.bg, color: '#fff' }}>
                  {KPI_ICONS[kpi.key]}
                </div>
                <div className="admin-dash-kpi-body">
                  <span className="admin-dash-kpi-num" style={{ color: kpi.color }}>
                    {kpi.key === 'avgResolutionTime'
                      ? Number(stats[kpi.key] || 0).toFixed(1)
                      : (stats[kpi.key] ?? 0)}
                  </span>
                  <span className="admin-dash-kpi-label">{kpi.label}</span>
                </div>
                <div className="admin-dash-kpi-shine" />
              </div>
            ))}
          </div>

          {/* Charts + Recent */}
          <div className="admin-dash-two-col">
            {/* Complaints by Category Bar Chart */}
            <section className="admin-dash-card">
              <div className="admin-dash-card-header">
                <div className="admin-dash-card-title-wrap">
                  <BarChart3 size={18} className="admin-dash-card-icon" />
                  <h3 className="admin-dash-card-title">Complaints by Category</h3>
                </div>
                {complaintsByCategory.length > 0 && (
                  <button className="admin-dash-view-all" onClick={() => onNavigate?.('analytics')}>
                    View Analytics <ChevronRight size={14} />
                  </button>
                )}
              </div>
              {chartData.length === 0 ? (
                <p className="admin-dash-empty">No category data available</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Complaints" radius={[6, 6, 0, 0]} barSize={28}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </section>

            {/* Recent Complaints */}
            <section className="admin-dash-card">
              <div className="admin-dash-card-header">
                <div className="admin-dash-card-title-wrap">
                  <Clock size={18} className="admin-dash-card-icon" />
                  <h3 className="admin-dash-card-title">Recent Complaints</h3>
                </div>
                {recentComplaints.length > 0 && (
                  <button className="admin-dash-view-all" onClick={() => onNavigate?.('complaints')}>
                    View All <ChevronRight size={14} />
                  </button>
                )}
              </div>
              {recentComplaints.length === 0 ? (
                <p className="admin-dash-empty">No complaints yet</p>
              ) : (
                <ul className="admin-dash-recent-list">
                  {recentComplaints.map((c) => (
                    <li key={c._id} className="admin-dash-recent-item">
                      <div className="admin-dash-recent-dot" style={{ background: statusColor(c.status) }} />
                      <div className="admin-dash-recent-info">
                        <span className="admin-dash-recent-title">{c.title || 'Untitled'}</span>
                        <span className="admin-dash-recent-meta">
                          {c.category || 'General'} &middot; {formatDate(c.createdAt)}
                        </span>
                      </div>
                      <span
                        className="admin-dash-recent-status"
                        style={{ background: statusColor(c.status) + '18', color: statusColor(c.status) }}
                      >
                        {(c.status || 'pending').replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Daily Trend Mini Chart */}
          {trendData.length > 0 && (
            <section className="admin-dash-card admin-dash-trend-card">
              <div className="admin-dash-card-header">
                <div className="admin-dash-card-title-wrap">
                  <TrendingUp size={18} className="admin-dash-card-icon" />
                  <h3 className="admin-dash-card-title">Last 30 Days Activity</h3>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Complaints" radius={[4, 4, 0, 0]} fill="#10b981" barSize={6} />
                </BarChart>
              </ResponsiveContainer>
            </section>
          )}

          {/* Quick Actions */}
          <section className="admin-dash-card admin-dash-actions">
            <div className="admin-dash-card-header">
              <div className="admin-dash-card-title-wrap">
                <ArrowUpRight size={18} className="admin-dash-card-icon" />
                <h3 className="admin-dash-card-title">Quick Actions</h3>
              </div>
            </div>
            <div className="admin-dash-actions-row">
              {onNavigate && (
                <>
                  <button className="admin-dash-action-btn" onClick={() => onNavigate('complaints')}>
                    <FileText size={16} />
                    <span>View All Complaints</span>
                  </button>
                  <button className="admin-dash-action-btn" onClick={() => onNavigate('gis-map')}>
                    <Map size={16} />
                    <span>View GIS Map</span>
                  </button>
                  <button className="admin-dash-action-btn primary" onClick={() => onNavigate('analytics')}>
                    <BarChart3 size={16} />
                    <span>Analytics</span>
                  </button>
                </>
              )}
            </div>
          </section>
        </>
      )}

      <style jsx>{`
        .admin-dash {
          padding: 0;
          max-width: 1400px;
          margin: 0 auto;
          overflow-y: auto;
          flex: 1;
          min-height: 0;
          scrollbar-width: thin;
          scrollbar-color: rgba(148, 163, 184, 0.6) rgba(241, 245, 249, 0.8);
        }

        /* Header */
        .admin-dash-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .admin-dash-header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .admin-dash-header-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, #02201a, #10b981);
          color: #fff;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }
        .admin-dash-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #02201a;
          margin: 0;
          letter-spacing: -0.02em;
        }
        .admin-dash-sub {
          margin: 2px 0 0;
          color: #64748b;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .admin-dash-date {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          color: #94a3b8;
        }
        .admin-dash-refresh {
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: #fff;
          color: #02201a;
          font-size: 0.82rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .admin-dash-refresh:hover { background: #f1f5f9; border-color: #94a3b8; }
        .admin-dash-refresh:disabled { opacity: 0.5; cursor: not-allowed; }
        .admin-dash-refresh :global(.spinning) {
          animation: admin-dash-spin 1s linear infinite;
        }

        /* Alert */
        .admin-dash-alert {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
          border-radius: 10px;
          padding: 12px 16px;
          margin-bottom: 20px;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Loading */
        .admin-dash-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          padding: 80px 0;
          color: #64748b;
        }
        .admin-dash-spinner {
          width: 36px;
          height: 36px;
          border: 3px solid #e2e8f0;
          border-top-color: #10b981;
          border-radius: 50%;
          animation: admin-dash-spin 0.8s linear infinite;
        }
        @keyframes admin-dash-spin { to { transform: rotate(360deg); } }

        /* KPI Grid */
        .admin-dash-kpi-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 14px;
          margin-bottom: 24px;
        }
        .admin-dash-kpi {
          background: #fff;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03);
          transition: transform 0.15s, box-shadow 0.15s;
          position: relative;
          overflow: hidden;
        }
        .admin-dash-kpi:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
        }
        .admin-dash-kpi-icon {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }
        .admin-dash-kpi-body {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .admin-dash-kpi-num {
          font-size: 1.4rem;
          font-weight: 700;
          line-height: 1.2;
        }
        .admin-dash-kpi-label {
          font-size: 0.7rem;
          color: #94a3b8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .admin-dash-kpi-shine {
          position: absolute;
          top: -20px;
          right: -20px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%);
          pointer-events: none;
        }

        /* Two-column layout */
        .admin-dash-two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          margin-bottom: 18px;
        }

        .admin-dash-card {
          background: #fff;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03);
        }
        .admin-dash-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .admin-dash-card-title-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .admin-dash-card-icon {
          color: #10b981;
        }
        .admin-dash-card-title {
          font-size: 0.95rem;
          font-weight: 600;
          color: #02201a;
          margin: 0;
        }
        .admin-dash-view-all {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          padding: 4px 10px;
          border: none;
          background: #f1f5f9;
          color: #64748b;
          font-size: 0.72rem;
          font-weight: 500;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .admin-dash-view-all:hover {
          background: #e2e8f0;
          color: #02201a;
        }
        .admin-dash-empty {
          color: #94a3b8;
          font-size: 0.85rem;
          text-align: center;
          padding: 40px 0;
        }

        .admin-dash-trend-card {
          margin-bottom: 18px;
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
          gap: 10px;
          padding: 10px 0;
          border-bottom: 1px solid #f1f5f9;
          transition: background 0.1s;
        }
        .admin-dash-recent-item:last-child { border-bottom: none; }
        .admin-dash-recent-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .admin-dash-recent-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
          flex: 1;
        }
        .admin-dash-recent-title {
          font-size: 0.82rem;
          font-weight: 500;
          color: #02201a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .admin-dash-recent-meta {
          font-size: 0.72rem;
          color: #94a3b8;
          margin-top: 2px;
        }
        .admin-dash-recent-status {
          font-size: 0.68rem;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 99px;
          white-space: nowrap;
          flex-shrink: 0;
          text-transform: capitalize;
        }

        /* Quick Actions */
        .admin-dash-actions {
          margin-bottom: 0;
        }
        .admin-dash-actions-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .admin-dash-action-btn {
          padding: 10px 18px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #fff;
          color: #334155;
          font-size: 0.82rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .admin-dash-action-btn:hover {
          background: #f8fafc;
          border-color: #10b981;
          color: #10b981;
        }
        .admin-dash-action-btn.primary {
          background: linear-gradient(135deg, #02201a, #10b981);
          color: #fff;
          border-color: transparent;
        }
        .admin-dash-action-btn.primary:hover {
          box-shadow: 0 4px 12px rgba(16,185,129,0.3);
          transform: translateY(-1px);
        }
        .admin-dash-action-btn:active { transform: scale(0.97); }

        /* Responsive */
        @media (max-width: 1200px) {
          .admin-dash-kpi-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (max-width: 1024px) {
          .admin-dash-two-col {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 768px) {
          .admin-dash-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .admin-dash-kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .admin-dash-actions-row {
            flex-direction: column;
          }
          .admin-dash-action-btn {
            justify-content: center;
          }
        }
        @media (max-width: 480px) {
          .admin-dash-kpi-grid {
            grid-template-columns: 1fr;
          }
          .admin-dash-kpi-icon {
            width: 36px;
            height: 36px;
          }
          .admin-dash-kpi-num {
            font-size: 1.2rem;
          }
        }
      `}</style>
    </div>
  );
}
