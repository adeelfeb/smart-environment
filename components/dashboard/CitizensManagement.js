'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { safeParseJsonResponse } from '../../utils/safeJsonResponse';

const ITEMS_PER_PAGE = 12;

function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function CitizensManagement({ user }) {
  const [citizens, setCitizens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [togglingId, setTogglingId] = useState(null);

  const fetchCitizens = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/users', {
        headers: authHeaders(),
        credentials: 'include',
      });
      const data = await safeParseJsonResponse(res);
      if (data.success && data.data) {
        const allUsers = data.data.users || [];
        const citizenUsers = allUsers.filter((u) => u.role === 'citizen' || u.role === 'base_user');
        setCitizens(citizenUsers);
      } else {
        setError(data.message || 'Failed to load citizens');
        setCitizens([]);
      }
    } catch {
      setError('Unable to connect. Please try again.');
      setCitizens([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCitizens();
  }, [fetchCitizens]);

  const togglePause = async (citizen) => {
    const id = citizen._id || citizen.id;
    setTogglingId(id);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify({ isPaused: !citizen.isPaused }),
      });
      const data = await safeParseJsonResponse(res);
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update citizen');
      }
      setCitizens((prev) =>
        prev.map((c) =>
          (c._id || c.id) === id ? { ...c, isPaused: !c.isPaused } : c
        )
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setTogglingId(null);
    }
  };

  const handleResetPassword = (citizen) => {
    const email = citizen.email || 'the user';
    alert(`A password reset email would be sent to ${email}.`);
  };

  const filtered = citizens.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const name = (c.name || '').toLowerCase();
    const email = (c.email || '').toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const totalCount = citizens.length;
  const activeCount = citizens.filter((c) => !c.isPaused).length;
  const pausedCount = citizens.filter((c) => c.isPaused).length;

  return (
    <div className="cm-panel">
      <header className="cm-header">
        <div>
          <h2 className="cm-title">Citizens Management</h2>
          <p className="cm-sub">View and manage citizen accounts</p>
        </div>
        <button className="cm-btn cm-btn-refresh" onClick={fetchCitizens} disabled={loading}>
          ↻ Refresh
        </button>
      </header>

      {error && <div className="cm-alert">{error}</div>}

      <div className="cm-stats">
        <div className="cm-stat-card">
          <span className="cm-stat-value">{totalCount}</span>
          <span className="cm-stat-label">Total Citizens</span>
        </div>
        <div className="cm-stat-card cm-stat-active">
          <span className="cm-stat-value">{activeCount}</span>
          <span className="cm-stat-label">Active</span>
        </div>
        <div className="cm-stat-card cm-stat-paused">
          <span className="cm-stat-value">{pausedCount}</span>
          <span className="cm-stat-label">Paused</span>
        </div>
      </div>

      <div className="cm-search-bar">
        <input
          type="text"
          className="cm-search-input"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        {search && (
          <button className="cm-search-clear" onClick={() => { setSearch(''); setPage(1); }}>
            ✕
          </button>
        )}
      </div>

      {loading ? (
        <div className="cm-loading">
          <div className="cm-spinner" />
          <span>Loading citizens...</span>
        </div>
      ) : paginated.length === 0 ? (
        <div className="cm-empty">
          {search ? 'No citizens match your search.' : 'No citizen accounts found.'}
        </div>
      ) : (
        <div className="cm-grid">
          {paginated.map((c) => {
            const id = c._id || c.id;
            const isPaused = !!c.isPaused;
            const isToggling = togglingId === id;
            return (
              <div key={id} className={`cm-card ${isPaused ? 'cm-card-paused' : ''}`}>
                <div className="cm-card-top">
                  <div className="cm-card-avatar">
                    {(c.name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="cm-card-info">
                    <span className="cm-card-name">{c.name || 'Unnamed'}</span>
                    <span className="cm-card-email">{c.email || '—'}</span>
                  </div>
                  <span className={`cm-badge ${isPaused ? 'cm-badge-paused' : 'cm-badge-active'}`}>
                    {isPaused ? 'Paused' : 'Active'}
                  </span>
                </div>
                <div className="cm-card-meta">
                  <div className="cm-card-meta-row">
                    <span className="cm-meta-label">Registered</span>
                    <span className="cm-meta-value">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </span>
                  </div>
                  {c.phone && (
                    <div className="cm-card-meta-row">
                      <span className="cm-meta-label">Phone</span>
                      <span className="cm-meta-value">{c.phone}</span>
                    </div>
                  )}
                </div>
                <div className="cm-card-actions">
                  <button
                    className={`cm-btn ${isPaused ? 'cm-btn-activate' : 'cm-btn-deactivate'}`}
                    onClick={() => togglePause(c)}
                    disabled={isToggling}
                  >
                    {isToggling ? '...' : isPaused ? 'Activate' : 'Deactivate'}
                  </button>
                  <button
                    className="cm-btn cm-btn-reset"
                    onClick={() => handleResetPassword(c)}
                  >
                    Reset Password
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="cm-pagination">
          <button
            className="cm-page-btn"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ‹ Prev
          </button>
          <span className="cm-page-info">
            Page {safePage} of {totalPages}
          </span>
          <button
            className="cm-page-btn"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next ›
          </button>
        </div>
      )}

      <style jsx>{`
        .cm-panel {
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .cm-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .cm-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #02201a;
          margin: 0;
        }

        .cm-sub {
          font-size: 0.875rem;
          color: #5f6b7a;
          margin: 4px 0 0;
        }

        .cm-alert {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 20px;
          font-size: 0.875rem;
        }

        .cm-stats {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .cm-stat-card {
          flex: 1;
          min-width: 140px;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .cm-stat-active {
          border-color: #6ee7b7;
          background: #f0fdf4;
        }

        .cm-stat-paused {
          border-color: #fca5a5;
          background: #fef2f2;
        }

        .cm-stat-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: #02201a;
        }

        .cm-stat-active .cm-stat-value {
          color: #059669;
        }

        .cm-stat-paused .cm-stat-value {
          color: #dc2626;
        }

        .cm-stat-label {
          font-size: 0.8rem;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          font-weight: 600;
        }

        .cm-search-bar {
          position: relative;
          margin-bottom: 24px;
        }

        .cm-search-input {
          width: 100%;
          padding: 12px 16px;
          padding-right: 40px;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
          background: #fff;
        }

        .cm-search-input:focus {
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }

        .cm-search-clear {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: #e5e7eb;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          font-size: 0.75rem;
          color: #6b7280;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
        }

        .cm-search-clear:hover {
          background: #d1d5db;
          color: #374151;
        }

        .cm-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 60px 20px;
          color: #6b7280;
          font-size: 0.95rem;
        }

        .cm-spinner {
          width: 24px;
          height: 24px;
          border: 3px solid #e5e7eb;
          border-top-color: #10b981;
          border-radius: 50%;
          animation: cm-spin 0.8s linear infinite;
        }

        @keyframes cm-spin {
          to { transform: rotate(360deg); }
        }

        .cm-empty {
          text-align: center;
          padding: 60px 20px;
          color: #6b7280;
          background: #f9fafb;
          border: 1px dashed #d1d5db;
          border-radius: 12px;
          font-size: 0.95rem;
        }

        .cm-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .cm-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          transition: box-shadow 0.2s, border-color 0.2s;
        }

        .cm-card:hover {
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
          border-color: #d1d5db;
        }

        .cm-card-paused {
          opacity: 0.75;
          border-style: dashed;
        }

        .cm-card-top {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .cm-card-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #d1fae5;
          color: #059669;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1rem;
          flex-shrink: 0;
        }

        .cm-card-paused .cm-card-avatar {
          background: #f3f4f6;
          color: #9ca3af;
        }

        .cm-card-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .cm-card-name {
          font-weight: 600;
          color: #02201a;
          font-size: 0.95rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .cm-card-email {
          font-size: 0.8rem;
          color: #6b7280;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .cm-badge {
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          flex-shrink: 0;
        }

        .cm-badge-active {
          background: #d1fae5;
          color: #065f46;
        }

        .cm-badge-paused {
          background: #fee2e2;
          color: #991b1b;
        }

        .cm-card-meta {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding-top: 12px;
          border-top: 1px solid #f3f4f6;
        }

        .cm-card-meta-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .cm-meta-label {
          font-size: 0.78rem;
          color: #9ca3af;
        }

        .cm-meta-value {
          font-size: 0.82rem;
          color: #374151;
          font-weight: 500;
        }

        .cm-card-actions {
          display: flex;
          gap: 8px;
          padding-top: 12px;
          border-top: 1px solid #f3f4f6;
        }

        .cm-btn {
          padding: 7px 14px;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          border: 1px solid transparent;
          cursor: pointer;
          transition: background 0.2s, opacity 0.2s;
        }

        .cm-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .cm-btn-refresh {
          background: #f0fdf4;
          color: #059669;
          border-color: #a7f3d0;
        }

        .cm-btn-refresh:hover:not(:disabled) {
          background: #dcfce7;
        }

        .cm-btn-deactivate {
          background: #fef2f2;
          color: #dc2626;
          border-color: #fecaca;
        }

        .cm-btn-deactivate:hover:not(:disabled) {
          background: #fee2e2;
        }

        .cm-btn-activate {
          background: #f0fdf4;
          color: #059669;
          border-color: #a7f3d0;
        }

        .cm-btn-activate:hover:not(:disabled) {
          background: #dcfce7;
        }

        .cm-btn-reset {
          background: #f9fafb;
          color: #374151;
          border-color: #d1d5db;
          flex: 1;
        }

        .cm-btn-reset:hover {
          background: #f3f4f6;
        }

        .cm-pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding-top: 8px;
        }

        .cm-page-btn {
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: #fff;
          color: #374151;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
        }

        .cm-page-btn:hover:not(:disabled) {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .cm-page-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .cm-page-info {
          font-size: 0.85rem;
          color: #6b7280;
        }

        @media (max-width: 640px) {
          .cm-panel {
            padding: 16px;
          }

          .cm-header {
            flex-direction: column;
          }

          .cm-stats {
            flex-direction: column;
          }

          .cm-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
