'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { safeParseJsonResponse } from '../../utils/safeJsonResponse';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
  AreaChart, Area, CartesianGrid,
  RadialBarChart, RadialBar,
} from 'recharts';
import {
  BarChart3, PieChart as PieIcon, TrendingUp, Activity,
  Building2, MapPin, Tag, Clock, CheckCircle, XCircle,
  AlertTriangle, Loader, RefreshCw, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';

const STATUS_CONFIG = [
  { key: 'pending', label: 'Pending', color: '#f59e0b' },
  { key: 'underReview', label: 'Under Review', color: '#3b82f6' },
  { key: 'workInProgress', label: 'Work in Progress', color: '#f97316' },
  { key: 'resolved', label: 'Resolved', color: '#10b981' },
  { key: 'rejected', label: 'Rejected', color: '#ef4444' },
];

const BAR_COLORS = [
  '#02201a', '#10b981', '#3b82f6', '#f59e0b', '#f97316',
  '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#64748b',
];

const GRADIENT_COLORS = [
  ['#02201a', '#1a5c44'],
  ['#10b981', '#34d399'],
  ['#3b82f6', '#60a5fa'],
  ['#f59e0b', '#fbbf24'],
  ['#f97316', '#fb923c'],
  ['#8b5cf6', '#a78bfa'],
  ['#ec4899', '#f472b6'],
  ['#06b6d4', '#22d3ee'],
  ['#14b8a6', '#2dd4bf'],
  ['#64748b', '#94a3b8'],
];

function getEntityName(item) {
  if (!item || !item._id) return 'Unknown';
  if (typeof item._id === 'object' && item._id !== null) {
    return item._id.name || item._id.toString?.() || 'Unknown';
  }
  const str = String(item._id);
  return str.length > 18 ? str.slice(0, 8) + '...' + str.slice(-6) : str;
}

function truncateDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const month = d.toLocaleString('default', { month: 'short' });
  return `${month} ${d.getDate()}`;
}

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

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0];
  return (
    <div style={{
      background: 'rgba(255,255,255,0.98)',
      border: '1px solid #e2e8f0',
      borderRadius: '10px',
      padding: '10px 14px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
      fontSize: '0.8rem',
    }}>
      <p style={{ margin: 0, color: data.payload?.fill || '#02201a', fontWeight: 600 }}>{data.name}</p>
      <p style={{ margin: '4px 0 0', color: '#64748b' }}>
        Count: <strong>{data.value}</strong> ({((data.value / data.payload?.total) * 100).toFixed(1)}%)
      </p>
    </div>
  );
};

const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  return (
    <g>
      <text x={cx} y={cy - 8} textAnchor="middle" fill="#02201a" fontSize="20" fontWeight="700">
        {value}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#64748b" fontSize="12">
        {`${(percent * 100).toFixed(1)}%`}
      </text>
      <Pie
        cx={cx} cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.9}
      />
    </g>
  );
};

function KPICard({ label, value, icon, color, trend, trendValue }) {
  return (
    <div className="analytics-kpi">
      <div className="analytics-kpi-icon" style={{ background: `${color}15`, color }}>
        {icon}
      </div>
      <div className="analytics-kpi-body">
        <span className="analytics-kpi-value" style={{ color }}>{value}</span>
        <span className="analytics-kpi-label">{label}</span>
      </div>
      {trend !== undefined && (
        <div className={`analytics-kpi-trend ${trend >= 0 ? 'up' : 'down'}`}>
          {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          <span>{Math.abs(trendValue || 0)}</span>
        </div>
      )}
    </div>
  );
}

export default function AnalyticsPanel({ user }) {
  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activePieIndex, setActivePieIndex] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch('/api/complaints/stats', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      const json = await safeParseJsonResponse(res);
      if (json.success && json.data) {
        setData(json.data);
        setStats(json.data.stats || {});
      } else {
        setError(json.message || 'Failed to load analytics data');
      }
    } catch {
      setError('Unable to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const corpData = (data?.complaintsByCorporation || []).map((d, i) => ({
    name: getEntityName(d),
    count: d.count || 0,
    fill: BAR_COLORS[i % BAR_COLORS.length],
  }));

  const wardData = (data?.complaintsByWard || []).slice(0, 10).map((d, i) => ({
    name: getEntityName(d),
    count: d.count || 0,
    fill: BAR_COLORS[(i + 1) % BAR_COLORS.length],
  }));

  const catData = (data?.complaintsByCategory || []).map((d, i) => ({
    name: d._id || 'Unknown',
    count: d.count || 0,
    fill: BAR_COLORS[i % BAR_COLORS.length],
  }));

  const safeStats = stats || {};
  const pieData = STATUS_CONFIG
    .filter(s => (safeStats[s.key] || 0) > 0)
    .map(s => ({
      name: s.label,
      value: safeStats[s.key] || 0,
      fill: s.color,
    }));
  const totalStatus = pieData.reduce((sum, d) => sum + d.value, 0);
  const pieDataWithTotal = pieData.map(d => ({ ...d, total: totalStatus }));

  const trendData = (data?.dailyTrend || []).map(d => ({
    date: truncateDate(d._id),
    count: d.count || 0,
  }));

  const resolutionData = STATUS_CONFIG
    .filter(s => s.key !== 'rejected')
    .map(s => ({
      name: s.label,
      value: safeStats[s.key] || 0,
      fill: s.color,
    }))
    .filter(d => d.value > 0);

  return (
    <div className="analytics-panel">
      {/* Header */}
      <header className="analytics-header">
        <div className="analytics-header-left">
          <div className="analytics-header-icon">
            <BarChart3 size={28} />
          </div>
          <div>
            <h2 className="analytics-title">Analytics Dashboard</h2>
            <p className="analytics-sub">
              Complaint statistics and trends
              {user?.name ? ` for ${user.name}` : ''}
            </p>
          </div>
        </div>
        <button className="analytics-refresh" onClick={fetchData} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          Refresh
        </button>
      </header>

      {error && (
        <div className="analytics-alert">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="analytics-loading">
          <div className="analytics-spinner" />
          <span>Loading analytics...</span>
        </div>
      ) : !data ? null : (
        <>
          {/* KPI Summary Cards */}
          <div className="analytics-kpi-grid">
            <KPICard
              label="Total Complaints"
              value={stats.total ?? 0}
              icon={<Activity size={20} />}
              color="#02201a"
            />
            <KPICard
              label="Pending"
              value={stats.pending ?? 0}
              icon={<Clock size={20} />}
              color="#f59e0b"
            />
            <KPICard
              label="Under Review"
              value={stats.underReview ?? 0}
              icon={<AlertTriangle size={20} />}
              color="#3b82f6"
            />
            <KPICard
              label="In Progress"
              value={stats.workInProgress ?? 0}
              icon={<Loader size={20} />}
              color="#f97316"
            />
            <KPICard
              label="Resolved"
              value={stats.resolved ?? 0}
              icon={<CheckCircle size={20} />}
              color="#10b981"
            />
            <KPICard
              label="Rejected"
              value={stats.rejected ?? 0}
              icon={<XCircle size={20} />}
              color="#ef4444"
            />
          </div>

          {/* Charts Grid */}
          <div className="analytics-charts-grid">
            {/* Status Distribution Pie */}
            <section className="analytics-chart-card">
              <div className="analytics-chart-header">
                <div className="analytics-chart-title-wrap">
                  <PieIcon size={18} className="analytics-chart-icon" />
                  <h3 className="analytics-chart-title">Status Distribution</h3>
                </div>
                <span className="analytics-chart-badge">{totalStatus} total</span>
              </div>
              {pieData.length === 0 ? (
                <p className="analytics-empty">No status data</p>
              ) : (
                <div className="analytics-pie-container">
                  <ResponsiveContainer width="100%" height={600}>
                    <PieChart>
                      <Pie
                        data={pieDataWithTotal}
                        cx="50%"
                        cy="50%"
                        innerRadius={220}
                        outerRadius={260}
                        paddingAngle={3}
                        dataKey="value"
                        activeIndex={activePieIndex}
                        activeShape={renderActiveShape}
                        onMouseEnter={(_, index) => setActivePieIndex(index)}
                      >
                        {pieDataWithTotal.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="analytics-pie-legend">
                    {pieDataWithTotal.map((d, i) => (
                      <div key={i} className="analytics-legend-item">
                        <span className="analytics-legend-dot" style={{ background: d.fill }} />
                        <span className="analytics-legend-label">{d.name}</span>
                        <span className="analytics-legend-value">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Complaints by Category Bar */}
            <section className="analytics-chart-card">
              <div className="analytics-chart-header">
                <div className="analytics-chart-title-wrap">
                  <Tag size={18} className="analytics-chart-icon" />
                  <h3 className="analytics-chart-title">Complaints by Category</h3>
                </div>
                <span className="analytics-chart-badge">{catData.length} categories</span>
              </div>
              {catData.length === 0 ? (
                <p className="analytics-empty">No category data</p>
              ) : (
                <ResponsiveContainer width="100%" height={600}>
                  <BarChart data={catData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#334155' }} width={100} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Complaints" radius={[0, 6, 6, 0]} barSize={50}>
                      {catData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </section>

            {/* Complaints by Corporation */}
            <section className="analytics-chart-card">
              <div className="analytics-chart-header">
                <div className="analytics-chart-title-wrap">
                  <Building2 size={18} className="analytics-chart-icon" />
                  <h3 className="analytics-chart-title">Complaints by Corporation</h3>
                </div>
                <span className="analytics-chart-badge">{corpData.length} corps</span>
              </div>
              {corpData.length === 0 ? (
                <p className="analytics-empty">No corporation data</p>
              ) : (
                <ResponsiveContainer width="100%" height={600}>
                  <BarChart data={corpData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#334155' }} width={120} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Complaints" radius={[0, 6, 6, 0]} barSize={50}>
                      {corpData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </section>

            {/* Complaints by Ward */}
            <section className="analytics-chart-card">
              <div className="analytics-chart-header">
                <div className="analytics-chart-title-wrap">
                  <MapPin size={18} className="analytics-chart-icon" />
                  <h3 className="analytics-chart-title">Complaints by Ward (Top 10)</h3>
                </div>
                <span className="analytics-chart-badge">{wardData.length} wards</span>
              </div>
              {wardData.length === 0 ? (
                <p className="analytics-empty">No ward data</p>
              ) : (
                <ResponsiveContainer width="100%" height={600}>
                  <BarChart data={wardData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#334155' }} width={120} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Complaints" radius={[0, 6, 6, 0]} barSize={50}>
                      {wardData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </section>

            {/* Daily Trend Area Chart - Full Width */}
            <section className="analytics-chart-card analytics-chart-card-full">
              <div className="analytics-chart-header">
                <div className="analytics-chart-title-wrap">
                  <TrendingUp size={18} className="analytics-chart-icon" />
                  <h3 className="analytics-chart-title">Daily Complaint Trend (Last 30 Days)</h3>
                </div>
                <span className="analytics-chart-badge">{trendData.length} days</span>
              </div>
              {trendData.length === 0 ? (
                <p className="analytics-empty">No trend data</p>
              ) : (
                <ResponsiveContainer width="100%" height={600}>
                  <AreaChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      name="Complaints"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fill="url(#trendGradient)"
                      dot={{ r: 5, fill: '#10b981', strokeWidth: 0 }}
                      activeDot={{ r: 20, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </section>

            {/* Resolution Funnel */}
            <section className="analytics-chart-card">
              <div className="analytics-chart-header">
                <div className="analytics-chart-title-wrap">
                  <CheckCircle size={18} className="analytics-chart-icon" />
                  <h3 className="analytics-chart-title">Resolution Overview</h3>
                </div>
              </div>
              {resolutionData.length === 0 ? (
                <p className="analytics-empty">No resolution data</p>
              ) : (
                <div className="analytics-resolution-list">
                  {resolutionData.map((d, i) => {
                    const pct = totalStatus > 0 ? ((d.value / totalStatus) * 100).toFixed(1) : 0;
                    return (
                      <div key={i} className="analytics-resolution-row">
                        <div className="analytics-resolution-left">
                          <span className="analytics-resolution-dot" style={{ background: d.fill }} />
                          <span className="analytics-resolution-label">{d.name}</span>
                        </div>
                        <div className="analytics-resolution-right">
                          <div className="analytics-resolution-bar-track">
                            <div
                              className="analytics-resolution-bar-fill"
                              style={{ width: `${pct}%`, background: d.fill }}
                            />
                          </div>
                          <span className="analytics-resolution-val">{d.value}</span>
                          <span className="analytics-resolution-pct">{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </>
      )}

      <style jsx>{`
        .analytics-panel {
          padding: 0;
          max-width: 1400px;
          margin: 0 auto;
          min-height: 100%;
          padding-bottom: 144px;
        }

        /* Header */
        .analytics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 88px;
        }
        .analytics-header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .analytics-header-icon {
          width: 112px;
          height: 112px;
          border-radius: 42px;
          background: linear-gradient(135deg, #02201a, #10b981);
          color: #fff;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }
        .analytics-title {
          font-size: 1.6rem;
          font-weight: 700;
          color: #02201a;
          margin: 0;
          letter-spacing: -0.02em;
        }
        .analytics-sub {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 0.9rem;
        }
        .analytics-refresh {
          padding: 10px 18px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: #fff;
          color: #02201a;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .analytics-refresh:hover { background: #f1f5f9; border-color: #94a3b8; }
        .analytics-refresh:disabled { opacity: 0.5; cursor: not-allowed; }
        .analytics-refresh :global(.spinning) {
          animation: analytics-spin 1s linear infinite;
        }

        /* Alert */
        .analytics-alert {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
          border-radius: 12px;
          padding: 44px 76px;
          margin-bottom: 84px;
          font-size: 1.5rem;
          display: flex;
          align-items: center;
          gap: 40px;
        }

        /* Loading */
        .analytics-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 46px;
          padding: 400px 0;
          color: #64748b;
        }
        .analytics-spinner {
          width: 100px;
          height: 100px;
          border: 3px solid #e2e8f0;
          border-top-color: #10b981;
          border-radius: 50%;
          animation: analytics-spin 0.8s linear infinite;
        }
        @keyframes analytics-spin { to { transform: rotate(360deg); } }

        /* KPI Grid */
        .analytics-kpi-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 76px;
          margin-bottom: 88px;
        }
        .analytics-kpi {
          background: #fff;
          border-radius: 14px;
          padding: 76px;
          display: flex;
          align-items: center;
          gap: 44px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03);
          transition: transform 0.15s, box-shadow 0.15s;
          position: relative;
          overflow: hidden;
        }
        .analytics-kpi:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
        }
        .analytics-kpi-icon {
          width: 104px;
          height: 104px;
          border-radius: 40px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }
        .analytics-kpi-body {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .analytics-kpi-value {
          font-size: 3rem;
          font-weight: 700;
          line-height: 1.2;
        }
        .analytics-kpi-label {
          font-size: 1.4rem;
          color: #94a3b8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .analytics-kpi-trend {
          position: absolute;
          top: 10px;
          right: 12px;
          display: flex;
          align-items: center;
          gap: 2px;
          font-size: 0.7rem;
          font-weight: 600;
        }
        .analytics-kpi-trend.up { color: #10b981; }
        .analytics-kpi-trend.down { color: #ef4444; }

        /* Charts Grid */
        .analytics-charts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
        }
        .analytics-chart-card {
          background: #fff;
          border-radius: 14px;
          padding: 84px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03);
        }
        .analytics-chart-card-full {
          grid-column: 1 / -1;
        }
        .analytics-chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 80px;
        }
        .analytics-chart-title-wrap {
          display: flex;
          align-items: center;
          gap: 38px;
        }
        .analytics-chart-icon {
          color: #10b981;
        }
        .analytics-chart-title {
          font-size: 1.75rem;
          font-weight: 600;
          color: #02201a;
          margin: 0;
        }
        .analytics-chart-badge {
          font-size: 1.4rem;
          font-weight: 500;
          color: #64748b;
          background: #f1f5f9;
          padding: 20px 60px;
          border-radius: 99px;
        }
        .analytics-empty {
          color: #94a3b8;
          font-size: 0.85rem;
          text-align: center;
          padding: 40px 0;
        }

        /* Pie legend */
        .analytics-pie-container {
          display: flex;
          flex-direction: column;
          gap: 76px;
        }
        .analytics-pie-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 40px 76px;
          justify-content: center;
        }
        .analytics-legend-item {
          display: flex;
          align-items: center;
          gap: 36px;
          font-size: 1.45rem;
        }
        .analytics-legend-dot {
          width: 40px;
          height: 40px;
          border-radius: 4px;
          flex-shrink: 0;
        }
        .analytics-legend-label { color: #334155; }
        .analytics-legend-value { color: #94a3b8; font-weight: 600; }

        /* Resolution list */
        .analytics-resolution-list {
          display: flex;
          flex-direction: column;
          gap: 76px;
        }
        .analytics-resolution-row {
          display: flex;
          flex-direction: column;
          gap: 38px;
        }
        .analytics-resolution-left {
          display: flex;
          align-items: center;
          gap: 40px;
        }
        .analytics-resolution-dot {
          width: 40px;
          height: 40px;
          border-radius: 4px;
          flex-shrink: 0;
        }
        .analytics-resolution-label {
          font-size: 1.5rem;
          font-weight: 500;
          color: #334155;
        }
        .analytics-resolution-right {
          display: flex;
          align-items: center;
          gap: 42px;
        }
        .analytics-resolution-bar-track {
          flex: 1;
          height: 40px;
          background: #f1f5f9;
          border-radius: 4px;
          overflow: hidden;
        }
        .analytics-resolution-bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.5s ease;
        }
        .analytics-resolution-val {
          font-size: 1.5rem;
          font-weight: 600;
          color: #02201a;
          width: 110px;
          text-align: right;
        }
        .analytics-resolution-pct {
          font-size: 1.45rem;
          color: #94a3b8;
          width: 120px;
          text-align: right;
        }

        /* Responsive */
        @media (max-width: 1200px) {
          .analytics-kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 1024px) {
          .analytics-charts-grid {
            grid-template-columns: 1fr;
          }
          .analytics-chart-card-full {
            grid-column: 1;
          }
        }
        @media (max-width: 768px) {
          .analytics-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 68px;
          }
          .analytics-kpi-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 480px) {
          .analytics-kpi-icon {
            width: 96px;
            height: 96px;
          }
          .analytics-kpi-value {
            font-size: 2.8rem;
          }
        }
      `}</style>
    </div>
  );
}
