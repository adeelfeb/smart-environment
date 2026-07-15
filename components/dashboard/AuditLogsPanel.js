'use client'

import { useState, useEffect, useCallback } from 'react'

export default function AuditLogsPanel({ user }) {
  const [logs, setLogs] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionFilter, setActionFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' })
      if (actionFilter) params.set('action', actionFilter)
      const res = await fetch(`/api/audit-logs?${params}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed to fetch audit logs')
      setLogs(json.data.logs)
      setPagination(json.data.pagination)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [actionFilter])

  useEffect(() => {
    fetchLogs(1)
  }, [fetchLogs])

  const goToPage = (page) => {
    if (page < 1 || page > pagination.pages) return
    fetchLogs(page)
  }

  const filteredLogs = logs.filter((log) => {
    if (!startDate && !endDate) return true
    const d = new Date(log.createdAt)
    if (startDate && d < new Date(startDate)) return false
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      if (d > end) return false
    }
    return true
  })

  const exportCSV = () => {
    const headers = ['Timestamp', 'User', 'Role', 'Email', 'Action', 'Target Type', 'Target ID', 'Details', 'IP Address']
    const rows = filteredLogs.map((log) => [
      new Date(log.createdAt).toISOString(),
      log.user?.name || '',
      log.user?.role || '',
      log.user?.email || '',
      log.action || '',
      log.targetType || '',
      log.targetId || '',
      typeof log.details === 'object' ? JSON.stringify(log.details) : (log.details || ''),
      log.ipAddress || ''
    ])
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const formatTimestamp = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    })
  }

  const actionTypes = [
    'user.login', 'user.logout', 'user.create', 'user.update', 'user.delete',
    'post.create', 'post.update', 'post.delete', 'post.publish',
    'comment.create', 'comment.update', 'comment.delete',
    'settings.update', 'role.update', 'system.backup', 'system.restore'
  ]

  const pageNumbers = []
  const start = Math.max(1, pagination.page - 2)
  const end = Math.min(pagination.pages, pagination.page + 2)
  for (let i = start; i <= end; i++) pageNumbers.push(i)

  return (
    <div className="audit-panel">
      <div className="panel-header">
        <div className="header-left">
          <h2>Audit Logs</h2>
          <span className="log-count">{pagination.total} total entries</span>
        </div>
        <button className="export-btn" onClick={exportCSV} disabled={loading || filteredLogs.length === 0}>
          Export CSV
        </button>
      </div>

      <div className="filters">
        <div className="filter-group">
          <label>Action</label>
          <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
            <option value="">All Actions</option>
            {actionTypes.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Start Date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="filter-group">
          <label>End Date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {loading ? (
        <div className="loading">Loading audit logs...</div>
      ) : (
        <>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Target Type</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty">No audit logs found</td>
                  </tr>
                ) : (
                  filteredLogs.map((log, i) => (
                    <tr key={log._id} className={i % 2 === 0 ? 'row-even' : 'row-odd'}>
                      <td className="timestamp">{formatTimestamp(log.createdAt)}</td>
                      <td>
                        <div className="user-cell">
                          <span className="user-name">{log.user?.name || 'Unknown'}</span>
                          <span className={`user-role role-${log.user?.role || 'unknown'}`}>{log.user?.role || 'N/A'}</span>
                        </div>
                      </td>
                      <td><span className="action-badge">{log.action}</span></td>
                      <td>{log.targetType || '—'}</td>
                      <td className="details-cell">
                        {log.details
                          ? (typeof log.details === 'object'
                              ? JSON.stringify(log.details)
                              : String(log.details))
                          : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className="pagination">
              <button onClick={() => goToPage(1)} disabled={pagination.page === 1}>«</button>
              <button onClick={() => goToPage(pagination.page - 1)} disabled={pagination.page === 1}>‹</button>
              {pageNumbers.map((p) => (
                <button key={p} className={p === pagination.page ? 'active' : ''} onClick={() => goToPage(p)}>
                  {p}
                </button>
              ))}
              <button onClick={() => goToPage(pagination.page + 1)} disabled={pagination.page === pagination.pages}>›</button>
              <button onClick={() => goToPage(pagination.pages)} disabled={pagination.page === pagination.pages}>»</button>
            </div>
          )}
        </>
      )}

      <style jsx>{`
.audit-panel {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.6) rgba(241, 245, 249, 0.8);
}
        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        h2 {
          margin: 0;
          font-size: 20px;
          color: #1a1a1a;
        }
        .log-count {
          color: #6b7280;
          font-size: 13px;
        }
        .export-btn {
          background: #16a34a;
          color: #fff;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }
        .export-btn:hover {
          background: #15803d;
        }
        .export-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
        .filters {
          display: flex;
          gap: 16px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .filter-group label {
          font-size: 12px;
          font-weight: 500;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .filter-group select,
        .filter-group input {
          padding: 7px 10px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 13px;
          color: #374151;
          background: #fff;
          min-width: 160px;
        }
        .filter-group select:focus,
        .filter-group input:focus {
          outline: none;
          border-color: #16a34a;
          box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.15);
        }
        .error-msg {
          background: #fef2f2;
          color: #dc2626;
          padding: 10px 14px;
          border-radius: 6px;
          font-size: 13px;
          margin-bottom: 16px;
        }
        .loading {
          text-align: center;
          padding: 40px;
          color: #6b7280;
          font-size: 14px;
        }
        .table-wrapper {
          overflow-x: auto;
          margin: 0 -24px;
          padding: 0 24px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        thead {
          position: sticky;
          top: 0;
        }
        th {
          text-align: left;
          padding: 10px 12px;
          background: #f0fdf4;
          color: #166534;
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 2px solid #bbf7d0;
          white-space: nowrap;
        }
        td {
          padding: 10px 12px;
          border-bottom: 1px solid #f3f4f6;
          color: #374151;
          vertical-align: middle;
        }
        .row-even {
          background: #fff;
        }
        .row-odd {
          background: #f9fafb;
        }
        tr:hover .row-even,
        tr:hover .row-odd {
          background: #f0fdf4;
        }
        .timestamp {
          white-space: nowrap;
          color: #6b7280;
          font-size: 12px;
        }
        .user-cell {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .user-name {
          font-weight: 500;
          color: #1a1a1a;
        }
        .user-role {
          font-size: 11px;
          padding: 1px 6px;
          border-radius: 4px;
          width: fit-content;
          font-weight: 500;
        }
        .role-super_admin {
          background: #fef3c7;
          color: #92400e;
        }
        .role-admin {
          background: #dbeafe;
          color: #1e40af;
        }
        .role-author {
          background: #f3e8ff;
          color: #7c3aed;
        }
        .role-user {
          background: #f3f4f6;
          color: #6b7280;
        }
        .role-unknown {
          background: #f3f4f6;
          color: #9ca3af;
        }
        .action-badge {
          display: inline-block;
          background: #f0fdf4;
          color: #166534;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-family: monospace;
          white-space: nowrap;
        }
        .details-cell {
          max-width: 300px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 12px;
          color: #6b7280;
        }
        .empty {
          text-align: center;
          padding: 32px 12px;
          color: #9ca3af;
        }
        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 4px;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid #f3f4f6;
        }
        .pagination button {
          min-width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #d1d5db;
          background: #fff;
          color: #374151;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .pagination button:hover:not(:disabled):not(.active) {
          border-color: #16a34a;
          color: #16a34a;
        }
        .pagination button.active {
          background: #16a34a;
          border-color: #16a34a;
          color: #fff;
        }
        .pagination button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        @media (max-width: 640px) {
          .panel-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .filters {
            flex-direction: column;
          }
          .filter-group select,
          .filter-group input {
            min-width: auto;
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}
