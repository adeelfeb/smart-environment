'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { safeParseJsonResponse } from '../../utils/safeJsonResponse';

const STATUS_OPTIONS = ['Pending', 'Under Review', 'Work in Progress', 'Resolved', 'Rejected'];

const CATEGORY_OPTIONS = [
  'Overflowing Dustbin',
  'Unauthorized Garbage Dumping',
  'Damaged Dustbin',
  'Missing Dustbin',
];

const STATUS_COLORS = {
  Pending: { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' },
  'Under Review': { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' },
  'Work in Progress': { bg: '#ffedd5', text: '#9a3412', border: '#f97316' },
  Resolved: { bg: '#d1fae5', text: '#065f46', border: '#10b981' },
  Rejected: { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' },
};

const PRIORITY_COLORS = {
  low: { bg: '#f0fdf4', text: '#166534' },
  medium: { bg: '#fefce8', text: '#854d0e' },
  high: { bg: '#fef2f2', text: '#991b1b' },
  urgent: { bg: '#fef2f2', text: '#7f1d1d', border: '#ef4444' },
};

export default function AdminComplaintList({ user, onSelectComplaint }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

  const [corporations, setCorporations] = useState([]);
  const [wards, setWards] = useState([]);

  const [filters, setFilters] = useState({
    status: '',
    category: '',
    corporation: '',
    ward: '',
    search: '',
    dateFrom: '',
    dateTo: '',
  });

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchComplaints = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (filters.status) params.set('status', filters.status);
      if (filters.category) params.set('category', filters.category);
      if (filters.corporation) params.set('corporation', filters.corporation);
      if (filters.ward) params.set('ward', filters.ward);
      if (filters.search) params.set('search', filters.search);

      const res = await fetch(`/api/complaints?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      const data = await safeParseJsonResponse(res);
      if (data.success && data.data) {
        setComplaints(data.data.complaints || []);
        setPagination(data.data.pagination || { page: 1, limit: 20, total: 0, pages: 0 });
      } else {
        setError(data.message || 'Failed to load complaints');
        setComplaints([]);
      }
    } catch {
      setError('Unable to connect. Please try again.');
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchComplaints(1);
  }, [fetchComplaints]);

  useEffect(() => {
    async function fetchCorps() {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/corporations', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: 'include',
        });
        const data = await safeParseJsonResponse(res);
        if (data.success && data.data) {
          setCorporations(Array.isArray(data.data) ? data.data : data.data.corporations || []);
        }
      } catch {}
    }
    fetchCorps();
  }, []);

  useEffect(() => {
    if (!filters.corporation) {
      setWards([]);
      return;
    }
    async function fetchWards() {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/wards?corporation=${filters.corporation}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: 'include',
        });
        const data = await safeParseJsonResponse(res);
        if (data.success && data.data) {
          setWards(Array.isArray(data.data) ? data.data : data.data.wards || []);
        }
      } catch {}
    }
    fetchWards();
  }, [filters.corporation]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, ...(key === 'corporation' ? { ward: '' } : {}) }));
  };

  const clearFilters = () => {
    setFilters({ status: '', category: '', corporation: '', ward: '', search: '', dateFrom: '', dateTo: '' });
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    fetchComplaints(newPage);
  };

  const isCreator = (complaint) => {
    if (!user?.id) return false;
    const citizenId = typeof complaint.citizen === 'object' ? complaint.citizen?._id : complaint.citizen;
    return citizenId && citizenId.toString() === user.id.toString();
  };

  const handleDeleteComplaint = async (complaintId) => {
    setDeletingId(complaintId);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`/api/complaints/${complaintId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      const data = await safeParseJsonResponse(res);
      if (data.success) {
        setComplaints((prev) => prev.filter((c) => (c._id || c.id) !== complaintId));
        setPagination((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      } else {
        setError(data.message || 'Failed to delete complaint');
      }
    } catch {
      setError('Unable to connect. Please try again.');
    } finally {
      setDeletingId(null);
      setDeleteConfirmId(null);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Complaint ID', 'Citizen Name', 'Type', 'Ward', 'Corporation', 'Address', 'Date', 'Status', 'Priority'];
    const rows = complaints.map(c => [
      c.id || c.complaintId || '',
      c.citizenName || c.user?.name || '',
      c.type || c.category || '',
      resolveName(c.ward),
      resolveName(c.corporation),
      resolveAddress(c),
      c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '',
      c.status || '',
      c.priority || '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `complaints_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '—';

  const resolveName = (val) => {
    if (!val) return '—';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') return val.name || val.wardNumber || '—';
    return String(val);
  };

  const resolveAddress = (c) => {
    const loc = c.location;
    if (loc && typeof loc === 'object' && loc.address) return loc.address;
    if (typeof c.address === 'string') return c.address;
    return '—';
  };

  const filteredComplaints = complaints.filter(c => {
    if (!filters.dateFrom && !filters.dateTo) return true;
    const d = c.createdAt ? new Date(c.createdAt) : null;
    if (!d) return true;
    if (filters.dateFrom && d < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && d > new Date(filters.dateTo + 'T23:59:59')) return false;
    return true;
  });

  const hasActiveFilters = Object.values(filters).some(v => v);

  return (
    <div className="acl">
      <header className="acl-header">
        <div>
          <h2 className="acl-title">Complaints</h2>
          <p className="acl-sub">{pagination.total} total complaint{pagination.total !== 1 ? 's' : ''}</p>
        </div>
        <div className="acl-header-actions">
          <button className="acl-export-btn" onClick={handleExportCSV} disabled={loading || !complaints.length}>
            ↓ Export CSV
          </button>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="acl-filters">
        <div className="acl-filter-row">
          <div className="acl-filter-group">
            <label className="acl-filter-label">Status</label>
            <select
              className="acl-filter-select"
              value={filters.status}
              onChange={e => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="acl-filter-group">
            <label className="acl-filter-label">Category</label>
            <select
              className="acl-filter-select"
              value={filters.category}
              onChange={e => handleFilterChange('category', e.target.value)}
            >
              <option value="">All Categories</option>
              {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="acl-filter-group">
            <label className="acl-filter-label">Corporation</label>
            <select
              className="acl-filter-select"
              value={filters.corporation}
              onChange={e => handleFilterChange('corporation', e.target.value)}
            >
              <option value="">All Corporations</option>
              {corporations.map(c => (
                <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="acl-filter-group">
            <label className="acl-filter-label">Ward</label>
            <select
              className="acl-filter-select"
              value={filters.ward}
              onChange={e => handleFilterChange('ward', e.target.value)}
              disabled={!filters.corporation}
            >
              <option value="">All Wards</option>
              {wards.map(w => (
                <option key={w.id || w._id} value={w.id || w._id}>{w.name || w.wardNumber}</option>
              ))}
            </select>
          </div>

          <div className="acl-filter-group">
            <label className="acl-filter-label">From</label>
            <input
              type="date"
              className="acl-filter-input"
              value={filters.dateFrom}
              onChange={e => handleFilterChange('dateFrom', e.target.value)}
            />
          </div>

          <div className="acl-filter-group">
            <label className="acl-filter-label">To</label>
            <input
              type="date"
              className="acl-filter-input"
              value={filters.dateTo}
              onChange={e => handleFilterChange('dateTo', e.target.value)}
            />
          </div>
        </div>

        <div className="acl-filter-row-bottom">
          <div className="acl-search-wrap">
            <span className="acl-search-icon">⌕</span>
            <input
              type="text"
              className="acl-search-input"
              placeholder="Search by ID, name, ward, address..."
              value={filters.search}
              onChange={e => handleFilterChange('search', e.target.value)}
            />
            {filters.search && (
              <button className="acl-search-clear" onClick={() => handleFilterChange('search', '')}>✕</button>
            )}
          </div>
          {hasActiveFilters && (
            <button className="acl-clear-btn" onClick={clearFilters}>Clear Filters</button>
          )}
        </div>
      </div>

      {error && <div className="acl-error">{error}</div>}

      {/* Table View - Desktop */}
      <div className="acl-table-wrap">
        <table className="acl-table">
          <thead>
            <tr>
              <th>Complaint ID</th>
              <th>Citizen Name</th>
              <th>Type</th>
              <th>Ward</th>
              <th>Corporation</th>
              <th>Address</th>
              <th>Date</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="acl-loading-cell">
                  <div className="acl-spinner" />
                  <span>Loading complaints...</span>
                </td>
              </tr>
            ) : filteredComplaints.length === 0 ? (
              <tr>
                <td colSpan={10} className="acl-empty-cell">No complaints found</td>
              </tr>
            ) : (
              filteredComplaints.map((c, i) => {
                const st = c.status || 'Pending';
                const sc = STATUS_COLORS[st] || STATUS_COLORS.Pending;
                const pr = (c.priority || 'low').toLowerCase();
                const pc = PRIORITY_COLORS[pr] || PRIORITY_COLORS.low;
                return (
                  <tr
                    key={c.id || c._id || i}
                    className={`acl-row ${i % 2 === 1 ? 'acl-row-alt' : ''}`}
                    onClick={() => onSelectComplaint && onSelectComplaint(c)}
                  >
                    <td className="acl-cell-id">{c.id || c.complaintId || '—'}</td>
                    <td>{c.citizenName || c.user?.name || '—'}</td>
                    <td>{c.type || c.category || '—'}</td>
                    <td>{resolveName(c.ward)}</td>
                    <td>{resolveName(c.corporation)}</td>
                    <td className="acl-cell-address">{resolveAddress(c)}</td>
                    <td>{formatDate(c.createdAt)}</td>
                    <td>
                      <span className="acl-chip" style={{ background: sc.bg, color: sc.text, borderColor: sc.border }}>
                        {st}
                      </span>
                    </td>
                    <td>
                      <span className="acl-chip" style={{ background: pc.bg, color: pc.text }}>
                        {c.priority || 'Low'}
                      </span>
                    </td>
                    <td>
                      {isCreator(c) && (
                        deleteConfirmId === (c._id || c.id) ? (
                          <div className="acl-delete-confirm">
                            <button
                              type="button"
                              className="acl-delete-yes"
                              disabled={deletingId === (c._id || c.id)}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteComplaint(c._id || c.id);
                              }}
                            >
                              {deletingId === (c._id || c.id) ? 'Deleting...' : 'Yes'}
                            </button>
                            <button
                              type="button"
                              className="acl-delete-no"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmId(null);
                              }}
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="acl-delete-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(c._id || c.id);
                            }}
                          >
                            Delete
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Card View - Mobile */}
      <div className="acl-cards">
        {loading ? (
          <div className="acl-loading-cell">
            <div className="acl-spinner" />
            <span>Loading complaints...</span>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="acl-empty-cell">No complaints found</div>
        ) : (
          filteredComplaints.map((c, i) => {
            const st = c.status || 'Pending';
            const sc = STATUS_COLORS[st] || STATUS_COLORS.Pending;
            const pr = (c.priority || 'low').toLowerCase();
            const pc = PRIORITY_COLORS[pr] || PRIORITY_COLORS.low;
            const photoUrls = [];
            if (c.photoUrl) {
              if (Array.isArray(c.photoUrl)) photoUrls.push(...c.photoUrl);
              else photoUrls.push(c.photoUrl);
            }
            if (c.photos && Array.isArray(c.photos)) {
              c.photos.forEach(p => { if (p.url && !photoUrls.includes(p.url)) photoUrls.push(p.url); });
            }
            const firstPhoto = photoUrls[0];
            return (
              <div
                key={c.id || c._id || i}
                className="acl-card"
                onClick={() => onSelectComplaint && onSelectComplaint(c)}
              >
                <div className="acl-card-receipt">
                  <div className="acl-card-header">
                    <span className="acl-card-id">{c.id || c.complaintId || '—'}</span>
                    <span className="acl-chip" style={{ background: sc.bg, color: sc.text, borderColor: sc.border }}>
                      {st}
                    </span>
                  </div>
                  <div className="acl-card-divider" />
                  <div className="acl-card-receipt-body">
                    {firstPhoto && (
                      <div className="acl-card-thumb-wrap">
                        <img src={firstPhoto} alt="" className="acl-card-thumb" loading="lazy" />
                        {photoUrls.length > 1 && <span className="acl-card-thumb-count">+{photoUrls.length - 1}</span>}
                      </div>
                    )}
                    <div className="acl-card-receipt-info">
                      <div className="acl-card-receipt-row"><span className="acl-card-label">Citizen</span><span>{c.citizenName || c.user?.name || '—'}</span></div>
                      <div className="acl-card-receipt-row"><span className="acl-card-label">Type</span><span>{c.type || c.category || '—'}</span></div>
                      <div className="acl-card-receipt-row"><span className="acl-card-label">Ward</span><span>{resolveName(c.ward)}</span></div>
                    </div>
                  </div>
                  <div className="acl-card-divider acl-card-divider--dashed" />
                  <div className="acl-card-receipt-meta">
                    <span>{resolveName(c.corporation)}</span>
                    <span>{formatDate(c.createdAt)}</span>
                    <span className="acl-chip acl-chip-sm" style={{ background: pc.bg, color: pc.text }}>{c.priority || 'Low'}</span>
                  </div>
                  <div className="acl-card-divider" />
                  {isCreator(c) && (
                    <div className="acl-card-actions">
                      {deleteConfirmId === (c._id || c.id) ? (
                        <div className="acl-delete-confirm">
                          <span className="acl-delete-text">Delete?</span>
                          <button
                            type="button"
                            className="acl-delete-yes"
                            disabled={deletingId === (c._id || c.id)}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteComplaint(c._id || c.id);
                            }}
                          >
                            {deletingId === (c._id || c.id) ? 'Deleting...' : 'Yes, Delete'}
                          </button>
                          <button
                            type="button"
                            className="acl-delete-no"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(null);
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="acl-delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(c._id || c.id);
                          }}
                        >
                          Delete Record
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="acl-pagination">
          <button
            className="acl-page-btn"
            disabled={pagination.page <= 1}
            onClick={() => handlePageChange(pagination.page - 1)}
          >
            ← Prev
          </button>
          <span className="acl-page-info">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            className="acl-page-btn"
            disabled={pagination.page >= pagination.pages}
            onClick={() => handlePageChange(pagination.page + 1)}
          >
            Next →
          </button>
        </div>
      )}

      <style jsx>{`
        .acl {
          background: #fff;
          border-radius: 12px;
          padding: 24px;
          min-height: 400px;
          overflow-y: auto;
          flex: 1;
          scrollbar-width: thin;
          scrollbar-color: rgba(148, 163, 184, 0.6) rgba(241, 245, 249, 0.8);
        }
        .acl-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 20px;
          gap: 12px;
          flex-wrap: wrap;
        }
        .acl-header-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .acl-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #02201a;
          margin: 0;
        }
        .acl-sub {
          font-size: 0.8rem;
          color: #64748b;
          margin: 4px 0 0 0;
        }
        .acl-export-btn {
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: #fff;
          color: #02201a;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }
        .acl-export-btn:hover:not(:disabled) {
          background: #02201a;
          color: #fff;
          border-color: #02201a;
        }
        .acl-export-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Filters */
        .acl-filters {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 16px;
          margin-bottom: 20px;
        }
        .acl-filter-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .acl-filter-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 140px;
          flex: 1;
        }
        .acl-filter-label {
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
        }
        .acl-filter-select,
        .acl-filter-input {
          padding: 8px 10px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.8rem;
          color: #1e293b;
          background: #fff;
          outline: none;
          transition: border-color 0.15s;
        }
        .acl-filter-select:focus,
        .acl-filter-input:focus {
          border-color: #10b981;
          box-shadow: 0 0 0 2px #10b98118;
        }
        .acl-filter-select:disabled {
          background: #f1f5f9;
          color: #94a3b8;
          cursor: not-allowed;
        }
        .acl-filter-row-bottom {
          display: flex;
          gap: 12px;
          margin-top: 12px;
          align-items: center;
          flex-wrap: wrap;
        }
        .acl-search-wrap {
          position: relative;
          flex: 1;
          min-width: 200px;
        }
        .acl-search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          font-size: 0.9rem;
          pointer-events: none;
        }
        .acl-search-input {
          width: 100%;
          padding: 8px 32px 8px 30px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.8rem;
          color: #1e293b;
          background: #fff;
          outline: none;
          transition: border-color 0.15s;
          box-sizing: border-box;
        }
        .acl-search-input:focus {
          border-color: #10b981;
          box-shadow: 0 0 0 2px #10b98118;
        }
        .acl-search-clear {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          font-size: 0.8rem;
          padding: 2px;
          line-height: 1;
        }
        .acl-search-clear:hover { color: #475569; }
        .acl-clear-btn {
          padding: 8px 14px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: #fff;
          color: #64748b;
          font-size: 0.78rem;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s;
        }
        .acl-clear-btn:hover {
          background: #ef4444;
          color: #fff;
          border-color: #ef4444;
        }

        /* Error */
        .acl-error {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 0.82rem;
          margin-bottom: 16px;
        }

        /* Table */
        .acl-table-wrap {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          margin-bottom: 20px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
        }
        .acl-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.82rem;
        }
        .acl-table thead {
          background: #f1f5f9;
        }
        .acl-table th {
          padding: 10px 12px;
          text-align: left;
          font-weight: 600;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #475569;
          border-bottom: 2px solid #e2e8f0;
          white-space: nowrap;
        }
        .acl-table td {
          padding: 10px 12px;
          border-bottom: 1px solid #f1f5f9;
          color: #334155;
          vertical-align: middle;
        }
        .acl-row {
          cursor: pointer;
          transition: background 0.1s;
        }
        .acl-row:hover {
          background: #f0fdf4 !important;
        }
        .acl-row-alt {
          background: #f8fafc;
        }
        .acl-cell-id {
          font-family: monospace;
          font-weight: 600;
          color: #02201a;
        }
        .acl-cell-address {
          max-width: 180px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Chips */
        .acl-chip {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 99px;
          font-size: 0.7rem;
          font-weight: 600;
          white-space: nowrap;
          border: 1px solid transparent;
        }
        .acl-chip-sm {
          padding: 2px 8px;
          font-size: 0.68rem;
        }

        /* Loading / Empty */
        .acl-loading-cell,
        .acl-empty-cell {
          text-align: center;
          padding: 40px 16px !important;
          color: #94a3b8;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .acl-spinner {
          width: 20px;
          height: 20px;
          border: 2.5px solid #e2e8f0;
          border-top-color: #10b981;
          border-radius: 50%;
          animation: acl-spin 0.7s linear infinite;
        }
        @keyframes acl-spin {
          to { transform: rotate(360deg); }
        }

        /* Pagination */
        .acl-pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 16px 0 4px;
        }
        .acl-page-btn {
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: #fff;
          color: #02201a;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }
        .acl-page-btn:hover:not(:disabled) {
          background: #02201a;
          color: #fff;
          border-color: #02201a;
        }
        .acl-page-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .acl-page-info {
          font-size: 0.8rem;
          color: #64748b;
        }

        /* Cards - hidden on desktop */
        .acl-cards {
          display: none;
        }

        /* Responsive */
        @media (max-width: 900px) {
          .acl { padding: 16px; }
          .acl-table-wrap { display: none; }
          .acl-cards {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .acl-card {
            background: #fff;
            border: 1.5px solid #e2e8f0;
            border-radius: 12px;
            cursor: pointer;
            transition: border-color 0.15s, box-shadow 0.15s;
            overflow: hidden;
          }
          .acl-card:hover {
            border-color: #10b981;
            box-shadow: 0 2px 8px #10b98118;
          }
          .acl-card-receipt {
            display: flex;
            flex-direction: column;
          }
          .acl-card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem 0.85rem 0.5rem;
          }
          .acl-card-divider {
            height: 1px;
            background: linear-gradient(90deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05));
            margin: 0 0.85rem;
          }
          .acl-card-divider--dashed {
            height: 0;
            border-top: 1px dashed rgba(16, 185, 129, 0.25);
            margin: 0.4rem 0.85rem;
            background: none;
          }
          .acl-card-receipt-body {
            display: flex;
            gap: 0.65rem;
            padding: 0.5rem 0.85rem;
            align-items: flex-start;
          }
          .acl-card-thumb-wrap {
            flex-shrink: 0;
            width: 56px;
            height: 56px;
            border-radius: 0.5rem;
            overflow: hidden;
            border: 1.5px solid #d1fae5;
            position: relative;
            background: #f0fdf4;
          }
          .acl-card-thumb {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          }
          .acl-card-thumb-count {
            position: absolute;
            bottom: 2px;
            right: 2px;
            background: rgba(2, 32, 26, 0.75);
            color: #fff;
            font-size: 0.5rem;
            font-weight: 700;
            padding: 1px 4px;
            border-radius: 3px;
            line-height: 1.2;
          }
          .acl-card-receipt-info {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 3px;
          }
          .acl-card-receipt-row {
            display: flex;
            gap: 6px;
            font-size: 0.72rem;
            color: #475569;
            align-items: center;
          }
          .acl-card-receipt-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            padding: 0.3rem 0.85rem 0.5rem;
            font-size: 0.68rem;
            color: #64748b;
            align-items: center;
          }
          .acl-card-id {
            font-family: monospace;
            font-weight: 600;
            font-size: 0.78rem;
            color: #02201a;
          }
          .acl-card-body {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .acl-card-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.78rem;
            color: #334155;
          }
          .acl-card-label {
            font-weight: 600;
            color: #64748b;
            font-size: 0.65rem;
            text-transform: uppercase;
            letter-spacing: 0.03em;
            flex-shrink: 0;
            margin-right: 6px;
          }
          .acl-card-actions {
            padding: 0.4rem 0.85rem 0.65rem;
          }
          .acl-filter-group {
            min-width: 120px;
          }
        }

        @media (max-width: 600px) {
          .acl-header {
            flex-direction: column;
          }
          .acl-filter-row {
            flex-direction: column;
          }
          .acl-filter-group {
            width: 100%;
          }
        }

        .acl-delete-btn {
          padding: 5px 12px;
          border: 1px solid #fecaca;
          border-radius: 6px;
          background: transparent;
          color: #dc2626;
          font-size: 0.72rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .acl-delete-btn:hover {
          background: #fef2f2;
          border-color: #f87171;
        }
        .acl-delete-confirm {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .acl-delete-text {
          font-size: 0.72rem;
          color: #991b1b;
          font-weight: 500;
        }
        .acl-delete-yes {
          padding: 4px 10px;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 5px;
          font-size: 0.7rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
        }
        .acl-delete-yes:hover:not(:disabled) {
          background: #b91c1c;
        }
        .acl-delete-yes:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .acl-delete-no {
          padding: 4px 10px;
          background: white;
          color: #475569;
          border: 1px solid #d1d5db;
          border-radius: 5px;
          font-size: 0.7rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }
        .acl-delete-no:hover {
          background: #f8fafc;
          border-color: #94a3b8;
        }
        .acl-card-actions {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #f1f5f9;
          display: flex;
          justify-content: flex-end;
        }
      `}</style>
    </div>
  );
}
