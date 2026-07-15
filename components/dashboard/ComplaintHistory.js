'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Filter, Calendar, ChevronLeft, ChevronRight, Loader2, AlertCircle, MapPin, Building2, FileText } from 'lucide-react';
import { safeParseJsonResponse } from '../../utils/safeJsonResponse';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'work_in_progress', label: 'Work in Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'rejected', label: 'Rejected' },
];

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'road_damage', label: 'Road Damage' },
  { value: 'water_supply', label: 'Water Supply' },
  { value: 'garbage_collection', label: 'Garbage Collection' },
  { value: 'street_lighting', label: 'Street Lighting' },
  { value: 'drainage', label: 'Drainage' },
  { value: 'noise_pollution', label: 'Noise Pollution' },
  { value: 'encroachment', label: 'Encroachment' },
  { value: 'other', label: 'Other' },
];

const STATUS_CHIP_STYLES = {
  pending: { bg: '#fef3c7', text: '#92400e', border: '#fbbf24' },
  under_review: { bg: '#dbeafe', text: '#1e40af', border: '#60a5fa' },
  work_in_progress: { bg: '#ffedd5', text: '#9a3412', border: '#fb923c' },
  resolved: { bg: '#d1fae5', text: '#065f46', border: '#34d399' },
  rejected: { bg: '#fee2e2', text: '#991b1b', border: '#f87171' },
};

function getStatusStyle(status) {
  const key = (status || '').toLowerCase().replace(/\s+/g, '_');
  return STATUS_CHIP_STYLES[key] || { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
}

function formatStatusLabel(status) {
  if (!status) return '—';
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

export default function ComplaintHistory({ user, onSelectComplaint }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [fetchingMore, setFetchingMore] = useState(false);

  const buildQueryParams = useCallback(
    (page = 1) => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '10');
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (statusFilter) params.set('status', statusFilter);
      if (categoryFilter) params.set('category', categoryFilter);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      return params.toString();
    },
    [searchQuery, statusFilter, categoryFilter, dateFrom, dateTo]
  );

  const fetchComplaints = useCallback(
    async (page = 1, append = false) => {
      if (append) {
        setFetchingMore(true);
      } else {
        setLoading(true);
      }
      setError('');

      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const query = buildQueryParams(page);
        const res = await fetch(`/api/complaints?${query}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: 'include',
        });
        const data = await safeParseJsonResponse(res);

        if (data.success && data.data) {
          const incoming = data.data.complaints || [];
          setComplaints((prev) => (append ? [...prev, ...incoming] : incoming));
          setPagination(data.data.pagination || { page: 1, limit: 10, total: 0, pages: 1 });
        } else {
          setError(data.message || 'Failed to load complaints');
        }
      } catch {
        setError('Unable to connect. Please try again.');
      } finally {
        setLoading(false);
        setFetchingMore(false);
      }
    },
    [buildQueryParams]
  );

  useEffect(() => {
    fetchComplaints(1, false);
  }, [fetchComplaints]);

  const handleSearchSubmit = useCallback(
    (e) => {
      e.preventDefault();
      fetchComplaints(1, false);
    },
    [fetchComplaints]
  );

  const handleFilterChange = useCallback(() => {
    fetchComplaints(1, false);
  }, [fetchComplaints]);

  const handlePageChange = useCallback(
    (page) => {
      fetchComplaints(page, false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [fetchComplaints]
  );

  const handleLoadMore = useCallback(() => {
    if (pagination.page < pagination.pages) {
      fetchComplaints(pagination.page + 1, true);
    }
  }, [fetchComplaints, pagination.page, pagination.pages]);

  const handleCardClick = useCallback(
    (complaint) => {
      if (typeof onSelectComplaint === 'function') {
        onSelectComplaint(complaint);
      }
    },
    [onSelectComplaint]
  );

  const filteredComplaints = useMemo(() => {
    if (!searchQuery.trim()) return complaints;
    const q = searchQuery.trim().toLowerCase();
    return complaints.filter(
      (c) =>
        (c.id || '').toLowerCase().includes(q) ||
        (c.category || '').toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q) ||
        (c.ward || '').toLowerCase().includes(q)
    );
  }, [complaints, searchQuery]);

  const pageNumbers = useMemo(() => {
    const { page, pages } = pagination;
    const delta = 2;
    const range = [];
    for (let i = Math.max(1, page - delta); i <= Math.min(pages, page + delta); i++) {
      range.push(i);
    }
    return range;
  }, [pagination]);

  const isEmpty = !loading && !error && filteredComplaints.length === 0;

  return (
    <div className="complaint-history">
      <header className="complaint-history-header">
        <h2 className="complaint-history-title">Complaint History</h2>
        <p className="complaint-history-desc">View and track all your submitted complaints.</p>
      </header>

      {error && (
        <div className="complaint-history-alert" role="alert">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="complaint-history-toolbar">
        <form className="complaint-history-search" onSubmit={handleSearchSubmit}>
          <Search size={18} className="complaint-history-search-icon" />
          <input
            type="text"
            placeholder="Search by ID, category, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="complaint-history-search-input"
          />
        </form>

        <div className="complaint-history-filters">
          <div className="complaint-history-filter-group">
            <Filter size={16} />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setTimeout(handleFilterChange, 0);
              }}
              className="complaint-history-select"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="complaint-history-filter-group">
            <FileText size={16} />
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setTimeout(handleFilterChange, 0);
              }}
              className="complaint-history-select"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="complaint-history-filter-group complaint-history-date-group">
            <Calendar size={16} />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="complaint-history-date-input"
              placeholder="From"
            />
            <span className="complaint-history-date-sep">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="complaint-history-date-input"
              placeholder="To"
            />
            <button
              type="button"
              className="complaint-history-apply-btn"
              onClick={handleFilterChange}
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="complaint-history-loading">
          <Loader2 size={24} className="complaint-history-spinner" />
          Loading complaints...
        </div>
      ) : isEmpty ? (
        <div className="complaint-history-empty">
          <AlertCircle size={40} />
          <p>No complaints found.</p>
        </div>
      ) : (
        <>
          <div className="complaint-history-count">
            Showing {filteredComplaints.length} of {pagination.total} complaint{pagination.total !== 1 ? 's' : ''}
          </div>

          <ul className="complaint-history-list">
            {filteredComplaints.map((complaint) => {
              const chipStyle = getStatusStyle(complaint.status);
              return (
                <li
                  key={complaint.id || complaint._id}
                  className="complaint-history-card"
                  onClick={() => handleCardClick(complaint)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') handleCardClick(complaint);
                  }}
                >
                  <div className="complaint-history-card-top">
                    <span className="complaint-history-card-id">
                      #{complaint.id || complaint._id || 'N/A'}
                    </span>
                    <span
                      className="complaint-history-chip"
                      style={{
                        backgroundColor: chipStyle.bg,
                        color: chipStyle.text,
                        borderColor: chipStyle.border,
                      }}
                    >
                      {formatStatusLabel(complaint.status)}
                    </span>
                  </div>

                  <div className="complaint-history-card-category">
                    {formatStatusLabel(complaint.category)}
                  </div>

                  <p className="complaint-history-card-desc">
                    {complaint.description
                      ? complaint.description.length > 120
                        ? complaint.description.slice(0, 120) + '...'
                        : complaint.description
                      : 'No description provided.'}
                  </p>

                  <div className="complaint-history-card-meta">
                    <span className="complaint-history-card-meta-item">
                      <Calendar size={14} />
                      {formatDate(complaint.createdAt || complaint.date)}
                    </span>
                    {complaint.ward && (
                      <span className="complaint-history-card-meta-item">
                        <MapPin size={14} />
                        Ward {typeof complaint.ward === 'object' ? complaint.ward.name || complaint.ward.wardNumber || '—' : complaint.ward}
                      </span>
                    )}
                    {complaint.corporation && (
                      <span className="complaint-history-card-meta-item">
                        <Building2 size={14} />
                        {typeof complaint.corporation === 'object' ? complaint.corporation.name || '—' : complaint.corporation}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {pagination.pages > 1 && (
            <div className="complaint-history-pagination">
              <button
                type="button"
                className="complaint-history-page-btn"
                disabled={pagination.page <= 1}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                <ChevronLeft size={18} />
              </button>

              {pageNumbers[0] > 1 && (
                <>
                  <button
                    type="button"
                    className="complaint-history-page-num"
                    onClick={() => handlePageChange(1)}
                  >
                    1
                  </button>
                  {pageNumbers[0] > 2 && <span className="complaint-history-page-ellipsis">...</span>}
                </>
              )}

              {pageNumbers.map((num) => (
                <button
                  key={num}
                  type="button"
                  className={`complaint-history-page-num ${num === pagination.page ? 'complaint-history-page-num--active' : ''}`}
                  onClick={() => handlePageChange(num)}
                >
                  {num}
                </button>
              ))}

              {pageNumbers[pageNumbers.length - 1] < pagination.pages && (
                <>
                  {pageNumbers[pageNumbers.length - 1] < pagination.pages - 1 && (
                    <span className="complaint-history-page-ellipsis">...</span>
                  )}
                  <button
                    type="button"
                    className="complaint-history-page-num"
                    onClick={() => handlePageChange(pagination.pages)}
                  >
                    {pagination.pages}
                  </button>
                </>
              )}

              <button
                type="button"
                className="complaint-history-page-btn"
                disabled={pagination.page >= pagination.pages}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          {pagination.page < pagination.pages && (
            <div className="complaint-history-load-more">
              <button
                type="button"
                className="complaint-history-load-more-btn"
                disabled={fetchingMore}
                onClick={handleLoadMore}
              >
                {fetchingMore ? (
                  <>
                    <Loader2 size={16} className="complaint-history-spinner" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </button>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .complaint-history {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .complaint-history-header {
          margin-bottom: 0.25rem;
        }

        .complaint-history-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #02201a;
          margin: 0 0 0.375rem 0;
        }

        .complaint-history-desc {
          color: #64748b;
          font-size: 1rem;
          margin: 0;
          line-height: 1.5;
        }

        .complaint-history-alert {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 1.25rem;
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fca5a5;
          border-radius: 0.75rem;
          font-weight: 500;
          font-size: 0.95rem;
        }

        .complaint-history-toolbar {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 1rem;
          padding: 1rem 1.25rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .complaint-history-search {
          position: relative;
          display: flex;
          align-items: center;
        }

        .complaint-history-search-icon {
          position: absolute;
          left: 0.875rem;
          color: #94a3b8;
          pointer-events: none;
        }

        .complaint-history-search-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 0.75rem;
          font-size: 0.95rem;
          color: #0f172a;
          background: #f8fafc;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }

        .complaint-history-search-input:focus {
          border-color: #059669;
          box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.12);
          background: white;
        }

        .complaint-history-search-input::placeholder {
          color: #94a3b8;
        }

        .complaint-history-filters {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.75rem;
        }

        .complaint-history-filter-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #64748b;
        }

        .complaint-history-select {
          padding: 0.5rem 2rem 0.5rem 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 0.625rem;
          font-size: 0.875rem;
          color: #334155;
          background: white;
          cursor: pointer;
          outline: none;
          appearance: auto;
          transition: border-color 0.2s;
        }

        .complaint-history-select:focus {
          border-color: #059669;
        }

        .complaint-history-date-group {
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }

        .complaint-history-date-input {
          padding: 0.5rem 0.625rem;
          border: 2px solid #e2e8f0;
          border-radius: 0.625rem;
          font-size: 0.85rem;
          color: #334155;
          background: white;
          outline: none;
          transition: border-color 0.2s;
        }

        .complaint-history-date-input:focus {
          border-color: #059669;
        }

        .complaint-history-date-sep {
          color: #94a3b8;
          font-size: 0.8rem;
        }

        .complaint-history-apply-btn {
          padding: 0.5rem 1rem;
          background: #059669;
          color: white;
          border: none;
          border-radius: 0.625rem;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
          white-space: nowrap;
        }

        .complaint-history-apply-btn:hover {
          background: #047857;
        }

        .complaint-history-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 3rem 2rem;
          color: #64748b;
          font-weight: 500;
          font-size: 1rem;
        }

        .complaint-history-spinner {
          animation: complaint-spin 1s linear infinite;
        }

        @keyframes complaint-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .complaint-history-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 3rem 2rem;
          color: #94a3b8;
          text-align: center;
        }

        .complaint-history-empty p {
          margin: 0;
          font-size: 1.05rem;
        }

        .complaint-history-count {
          font-size: 0.85rem;
          color: #64748b;
          font-weight: 500;
        }

        .complaint-history-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
        }

        .complaint-history-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 1rem;
          padding: 1.25rem 1.5rem;
          cursor: pointer;
          transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .complaint-history-card:hover {
          border-color: #059669;
          box-shadow: 0 4px 16px rgba(5, 150, 105, 0.1);
          transform: translateY(-1px);
        }

        .complaint-history-card:focus-visible {
          outline: 2px solid #059669;
          outline-offset: 2px;
        }

        .complaint-history-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .complaint-history-card-id {
          font-size: 0.8rem;
          font-weight: 700;
          color: #02201a;
          letter-spacing: 0.02em;
          font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
        }

        .complaint-history-chip {
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          border: 1px solid;
          white-space: nowrap;
          line-height: 1.4;
        }

        .complaint-history-card-category {
          display: inline-block;
          font-size: 0.8rem;
          font-weight: 600;
          color: #059669;
          background: #ecfdf5;
          padding: 0.2rem 0.625rem;
          border-radius: 0.375rem;
          margin-bottom: 0.625rem;
        }

        .complaint-history-card-desc {
          font-size: 0.925rem;
          color: #475569;
          line-height: 1.55;
          margin: 0 0 0.75rem 0;
        }

        .complaint-history-card-meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 1rem;
          font-size: 0.8rem;
          color: #64748b;
        }

        .complaint-history-card-meta-item {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
        }

        .complaint-history-pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.375rem;
          margin-top: 0.5rem;
          flex-wrap: wrap;
        }

        .complaint-history-page-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 2.25rem;
          height: 2.25rem;
          border: 2px solid #e2e8f0;
          border-radius: 0.625rem;
          background: white;
          color: #334155;
          cursor: pointer;
          transition: all 0.2s;
        }

        .complaint-history-page-btn:hover:not(:disabled) {
          border-color: #059669;
          color: #059669;
        }

        .complaint-history-page-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .complaint-history-page-num {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 2.25rem;
          height: 2.25rem;
          padding: 0 0.5rem;
          border: 2px solid transparent;
          border-radius: 0.625rem;
          background: transparent;
          color: #64748b;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .complaint-history-page-num:hover {
          background: #f0fdf4;
          color: #059669;
        }

        .complaint-history-page-num--active {
          background: #059669;
          color: white;
          border-color: #059669;
          font-weight: 700;
        }

        .complaint-history-page-num--active:hover {
          background: #047857;
          color: white;
        }

        .complaint-history-page-ellipsis {
          color: #94a3b8;
          padding: 0 0.25rem;
          font-size: 0.9rem;
        }

        .complaint-history-load-more {
          display: flex;
          justify-content: center;
          margin-top: 0.5rem;
        }

        .complaint-history-load-more-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1.75rem;
          background: white;
          color: #059669;
          border: 2px solid #059669;
          border-radius: 0.75rem;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .complaint-history-load-more-btn:hover:not(:disabled) {
          background: #059669;
          color: white;
        }

        .complaint-history-load-more-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .complaint-history-title {
            font-size: 1.4rem;
          }

          .complaint-history-toolbar {
            padding: 0.875rem 1rem;
          }

          .complaint-history-filters {
            flex-direction: column;
            align-items: stretch;
          }

          .complaint-history-filter-group {
            width: 100%;
          }

          .complaint-history-select,
          .complaint-history-date-input {
            flex: 1;
            min-width: 0;
          }

          .complaint-history-date-group {
            flex-wrap: wrap;
          }

          .complaint-history-card {
            padding: 1rem 1.125rem;
          }

          .complaint-history-card-top {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .complaint-history-card-meta {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .complaint-history-pagination {
            gap: 0.25rem;
          }
        }

        @media (max-width: 480px) {
          .complaint-history-card {
            padding: 0.875rem 1rem;
            border-radius: 0.75rem;
          }

          .complaint-history-page-btn,
          .complaint-history-page-num {
            width: 2rem;
            height: 2rem;
            min-width: 2rem;
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  );
}
