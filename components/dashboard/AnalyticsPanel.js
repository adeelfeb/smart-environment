'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { safeParseJsonResponse } from '../../utils/safeJsonResponse';

const BAR_COLORS = [
  '#02201a', '#10b981', '#3b82f6', '#f59e0b', '#f97316',
  '#8b5cf6', '#ec4899', '#06b6d4', '#64748b', '#14b8a6',
];

const STATUS_CONFIG = [
  { key: 'pending', label: 'Pending', color: '#f59e0b' },
  { key: 'underReview', label: 'Under Review', color: '#3b82f6' },
  { key: 'workInProgress', label: 'Work in Progress', color: '#f97316' },
  { key: 'resolved', label: 'Resolved', color: '#10b981' },
  { key: 'rejected', label: 'Rejected', color: '#ef4444' },
];

function getEntityName(item) {
  if (!item || !item._id) return 'Unknown';
  if (typeof item._id === 'object' && item._id !== null) {
    return item._id.name || item._id.toString?.() || 'Unknown';
  }
  const str = String(item._id);
  return str.length > 16 ? str.slice(0, 8) + '…' + str.slice(-6) : str;
}

function truncateDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const month = d.toLocaleString('default', { month: 'short' });
  return `${month} ${d.getDate()}`;
}

function HorizontalBarChart({ data, labelKey, valueKey, maxVal, colors }) {
  const max = maxVal || Math.max(...data.map(d => d[valueKey] || 0), 1);
  return (
    <div className="analytics-hbar">
      {data.map((item, i) => {
        const val = item[valueKey] || 0;
        const pct = max > 0 ? (val / max) * 100 : 0;
        const label = labelKey === 'name' ? getEntityName(item) : item[labelKey];
        return (
          <div key={item[labelKey] || i} className="analytics-hbar-row">
            <span className="analytics-hbar-label" title={label}>{label}</span>
            <div className="analytics-hbar-track">
              <div
                className="analytics-hbar-fill"
                style={{ width: pct + '%', background: colors[i % colors.length] }}
              />
            </div>
            <span className="analytics-hbar-val">{val}</span>
          </div>
        );
      })}
    </div>
  );
}

function TrendChart({ data }) {
  if (!data || data.length === 0) return <p className="analytics-empty">No trend data</p>;
  const max = Math.max(...data.map(d => d.count || 0), 1);
  return (
    <div className="analytics-trend">
      <div className="analytics-trend-axis">
        <span className="analytics-trend-axis-label">{max}</span>
        <span className="analytics-trend-axis-label">0</span>
      </div>
      <div className="analytics-trend-chart">
        {data.map((d, i) => {
          const h = max > 0 ? ((d.count || 0) / max) * 100 : 0;
          return (
            <div key={d._id || i} className="analytics-trend-col" title={`${truncateDate(d._id)}: ${d.count}`}>
              <span className="analytics-trend-bar-val">{d.count > 0 ? d.count : ''}</span>
              <div className="analytics-trend-bar-wrap">
                <div className="analytics-trend-bar" style={{ height: Math.max(h, 2) + '%' }} />
              </div>
              {i % Math.ceil(data.length / 8) === 0 && (
                <span className="analytics-trend-date">{truncateDate(d._id)}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusPie({ stats }) {
  const entries = STATUS_CONFIG.filter(s => (stats[s.key] || 0) > 0);
  const total = entries.reduce((sum, s) => sum + (stats[s.key] || 0), 0);
  if (total === 0) return <p className="analytics-empty">No status data</p>;
  return (
    <div className="analytics-pie-wrap">
      <div className="analytics-pie">
        <div className="analytics-pie-donut">
          {(() => {
            let acc = 0;
            return entries.map(s => {
              const val = stats[s.key] || 0;
              const pct = (val / total) * 100;
              const seg = (
                <div
                  key={s.key}
                  className="analytics-pie-segment"
                  style={{
                    background: s.color,
                    width: pct + '%',
                  }}
                  title={`${s.label}: ${val}`}
                />
              );
              acc += pct;
              return seg;
            });
          })()}
        </div>
        <div className="analytics-pie-total">{total}</div>
      </div>
      <div className="analytics-pie-legend">
        {entries.map(s => {
          const val = stats[s.key] || 0;
          const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
          return (
            <div key={s.key} className="analytics-pie-legend-item">
              <span className="analytics-pie-dot" style={{ background: s.color }} />
              <span className="analytics-pie-legend-label">{s.label}</span>
              <span className="analytics-pie-legend-val">{val} ({pct}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AnalyticsPanel({ user }) {
  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const corpData = data?.complaintsByCorporation || [];
  const wardData = (data?.complaintsByWard || []).slice(0, 10);
  const catData = data?.complaintsByCategory || [];
  const trendData = data?.dailyTrend || [];

  const maxCorp = Math.max(...corpData.map(d => d.count || 0), 1);
  const maxWard = Math.max(...wardData.map(d => d.count || 0), 1);
  const maxCat = Math.max(...catData.map(d => d.count || 0), 1);

  return (
    <div className="analytics-panel">
      <header className="analytics-header">
        <div>
          <h2 className="analytics-title">Analytics Dashboard</h2>
          <p className="analytics-sub">
            Complaint statistics and trends
            {user?.name ? ` for ${user.name}` : ''}
          </p>
        </div>
        <button className="analytics-refresh" onClick={fetchData} disabled={loading}>
          ↻ Refresh
        </button>
      </header>

      {error && <div className="analytics-alert">{error}</div>}

      {loading ? (
        <div className="analytics-loading">
          <div className="analytics-spinner" />
          <span>Loading analytics…</span>
        </div>
      ) : !data ? null : (
        <div className="analytics-grid">
          {/* Complaints by Corporation */}
          <section className="analytics-card">
            <h3 className="analytics-card-title">Complaints by Corporation</h3>
            {corpData.length === 0 ? (
              <p className="analytics-empty">No corporation data</p>
            ) : (
              <HorizontalBarChart data={corpData} labelKey="name" valueKey="count" maxVal={maxCorp} colors={BAR_COLORS} />
            )}
          </section>

          {/* Complaints by Ward */}
          <section className="analytics-card">
            <h3 className="analytics-card-title">Complaints by Ward (Top 10)</h3>
            {wardData.length === 0 ? (
              <p className="analytics-empty">No ward data</p>
            ) : (
              <HorizontalBarChart data={wardData} labelKey="name" valueKey="count" maxVal={maxWard} colors={BAR_COLORS.slice(1)} />
            )}
          </section>

          {/* Complaints by Category */}
          <section className="analytics-card">
            <h3 className="analytics-card-title">Complaints by Category</h3>
            {catData.length === 0 ? (
              <p className="analytics-empty">No category data</p>
            ) : (
              <HorizontalBarChart data={catData} labelKey="_id" valueKey="count" maxVal={maxCat} colors={BAR_COLORS} />
            )}
          </section>

          {/* Status Distribution */}
          <section className="analytics-card">
            <h3 className="analytics-card-title">Status Distribution</h3>
            <StatusPie stats={stats} />
          </section>

          {/* Daily Trend - full width */}
          <section className="analytics-card analytics-card-full">
            <h3 className="analytics-card-title">Daily Trend (Last 30 Days)</h3>
            <TrendChart data={trendData} />
          </section>
        </div>
      )}

      <style jsx>{`
        .analytics-panel {
          padding: 24px;
          max-width: 1280px;
          margin: 0 auto;
        }

        .analytics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
        }
        .analytics-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #02201a;
          margin: 0;
        }
        .analytics-sub {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 0.9rem;
        }
        .analytics-refresh {
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
        .analytics-refresh:hover { background: #f1f5f9; }
        .analytics-refresh:disabled { opacity: 0.5; cursor: not-allowed; }

        .analytics-alert {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 20px;
          font-size: 0.875rem;
        }

        .analytics-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          padding: 80px 0;
          color: #64748b;
        }
        .analytics-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #e2e8f0;
          border-top-color: #10b981;
          border-radius: 50%;
          animation: analytics-spin 0.8s linear infinite;
        }
        @keyframes analytics-spin {
          to { transform: rotate(360deg); }
        }

        /* Grid */
        .analytics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .analytics-card {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03);
          padding: 20px;
        }
        .analytics-card-full {
          grid-column: 1 / -1;
        }
        .analytics-card-title {
          font-size: 1rem;
          font-weight: 600;
          color: #02201a;
          margin: 0 0 16px;
        }
        .analytics-empty {
          color: #94a3b8;
          font-size: 0.85rem;
          text-align: center;
          padding: 32px 0;
        }

        /* Horizontal bar chart */
        .analytics-hbar {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .analytics-hbar-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .analytics-hbar-label {
          width: 130px;
          font-size: 0.8rem;
          color: #334155;
          text-align: right;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex-shrink: 0;
        }
        .analytics-hbar-track {
          flex: 1;
          height: 22px;
          background: #f1f5f9;
          border-radius: 6px;
          overflow: hidden;
        }
        .analytics-hbar-fill {
          height: 100%;
          border-radius: 6px;
          transition: width 0.4s ease;
          min-width: 2px;
        }
        .analytics-hbar-val {
          width: 36px;
          font-size: 0.8rem;
          font-weight: 600;
          color: #02201a;
          text-align: right;
          flex-shrink: 0;
        }

        /* Trend chart */
        .analytics-trend {
          display: flex;
          gap: 8px;
          height: 200px;
        }
        .analytics-trend-axis {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: flex-end;
          padding: 0 4px 20px 0;
          flex-shrink: 0;
        }
        .analytics-trend-axis-label {
          font-size: 0.65rem;
          color: #94a3b8;
        }
        .analytics-trend-chart {
          flex: 1;
          display: flex;
          align-items: flex-end;
          gap: 2px;
          border-bottom: 1px solid #e2e8f0;
          overflow: hidden;
        }
        .analytics-trend-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 0;
          height: 100%;
          justify-content: flex-end;
          position: relative;
        }
        .analytics-trend-bar-wrap {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }
        .analytics-trend-bar {
          width: 80%;
          max-width: 20px;
          background: #10b981;
          border-radius: 3px 3px 0 0;
          transition: height 0.3s ease;
          min-height: 2px;
        }
        .analytics-trend-bar-val {
          font-size: 0.55rem;
          color: #64748b;
          white-space: nowrap;
          margin-bottom: 2px;
        }
        .analytics-trend-date {
          font-size: 0.6rem;
          color: #94a3b8;
          margin-top: 6px;
          white-space: nowrap;
          position: absolute;
          bottom: -20px;
        }

        /* Status pie */
        .analytics-pie-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }
        .analytics-pie {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .analytics-pie-donut {
          width: 160px;
          height: 160px;
          border-radius: 50%;
          display: flex;
          overflow: hidden;
          transform: rotate(-90deg);
        }
        .analytics-pie-segment {
          height: 100%;
          transition: width 0.4s ease;
        }
        .analytics-pie-total {
          position: absolute;
          font-size: 1.4rem;
          font-weight: 700;
          color: #02201a;
        }
        .analytics-pie-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 8px 16px;
          justify-content: center;
        }
        .analytics-pie-legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
        }
        .analytics-pie-dot {
          width: 10px;
          height: 10px;
          border-radius: 3px;
          flex-shrink: 0;
        }
        .analytics-pie-legend-label {
          color: #334155;
        }
        .analytics-pie-legend-val {
          color: #64748b;
          font-size: 0.75rem;
        }

        @media (max-width: 768px) {
          .analytics-panel { padding: 16px; }
          .analytics-grid { grid-template-columns: 1fr; }
          .analytics-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .analytics-hbar-label { width: 90px; font-size: 0.7rem; }
        }
      `}</style>
    </div>
  );
}
