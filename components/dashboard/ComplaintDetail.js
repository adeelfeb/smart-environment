'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Building2,
  Landmark,
  Upload,
  CheckCircle,
  XCircle,
  MessageSquare,
  AlertTriangle,
  Clock,
  Image as ImageIcon,
} from 'lucide-react';
import { safeParseJsonResponse } from '../../utils/safeJsonResponse';

const STATUS_OPTIONS = [
  'Pending',
  'Under Review',
  'Work in Progress',
  'Resolved',
  'Rejected',
];

const STATUS_COLORS = {
  Pending: { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' },
  'Under Review': { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' },
  'Work in Progress': { bg: '#ffedd5', text: '#9a3412', border: '#f97316' },
  Resolved: { bg: '#d1fae5', text: '#065f46', border: '#10b981' },
  Rejected: { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' },
};

const CATEGORY_ICONS = {
  Pothole: '🕳️',
  'Street Light': '💡',
  'Garbage Collection': '🗑️',
  'Water Supply': '💧',
  Drainage: '🚿',
  'Road Damage': '🚧',
  Noise: '🔊',
  'Stray Animals': '🐕',
  Encroachment: '🏗️',
  Other: '📋',
};

export default function ComplaintDetail({ complaint: complaintProp, user, onBack, onUpdated }) {
  const [complaint, setComplaint] = useState(complaintProp || null);
  const [loading, setLoading] = useState(!complaintProp);
  const [error, setError] = useState('');
  const [remarkText, setRemarkText] = useState('');
  const [remarkLoading, setRemarkLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [resolveLoading, setResolveLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [verifyFile, setVerifyFile] = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyPreview, setVerifyPreview] = useState(null);
  const fileInputRef = useRef(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  useEffect(() => {
    if (!complaintProp && complaint?.id) {
      fetchComplaint(complaint.id);
    }
  }, [complaintProp, complaint?.id]);

  const fetchComplaint = async (id) => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/complaints/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      const data = await safeParseJsonResponse(res);
      if (data.success && data.data) {
        setComplaint(data.data.complaint || data.data);
      } else {
        setError(data.message || 'Failed to load complaint');
      }
    } catch {
      setError('Unable to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!complaint?.id || statusLoading) return;
    setStatusLoading(true);
    setActionMessage(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/complaints/${complaint.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await safeParseJsonResponse(res);
      if (!res.ok) throw new Error(data.message || 'Failed to update status');
      setActionMessage({ type: 'success', text: `Status updated to "${newStatus}"` });
      if (data.data?.complaint) {
        setComplaint(data.data.complaint);
      } else {
        setComplaint((prev) => ({ ...prev, status: newStatus }));
      }
      if (typeof onUpdated === 'function') onUpdated();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Update failed' });
    } finally {
      setStatusLoading(false);
    }
  };

  const handleAddRemark = async () => {
    if (!complaint?.id || !remarkText.trim() || remarkLoading) return;
    setRemarkLoading(true);
    setActionMessage(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/complaints/${complaint.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ action: 'add-remark', remark: remarkText.trim() }),
      });
      const data = await safeParseJsonResponse(res);
      if (!res.ok) throw new Error(data.message || 'Failed to add remark');
      setRemarkText('');
      setActionMessage({ type: 'success', text: 'Remark added' });
      if (data.data?.complaint) {
        setComplaint(data.data.complaint);
      }
      if (typeof onUpdated === 'function') onUpdated();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to add remark' });
    } finally {
      setRemarkLoading(false);
    }
  };

  const handleVerifyFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setActionMessage({ type: 'error', text: 'Please select an image file' });
      return;
    }
    setVerifyFile(file);
    setVerifyPreview(URL.createObjectURL(file));
  };

  const handleUploadVerification = async () => {
    if (!complaint?.id || !verifyFile || verifyLoading) return;
    setVerifyLoading(true);
    setActionMessage(null);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', verifyFile);
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
        body: formData,
      });
      const uploadData = await safeParseJsonResponse(uploadRes);
      if (!uploadRes.ok) throw new Error(uploadData.message || 'Photo upload failed');

      const photoUrl = uploadData.data?.url || uploadData.url || '';
      const photoFilename = uploadData.data?.filename || uploadData.filename || verifyFile.name;

      const res = await fetch(`/api/complaints/${complaint.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ action: 'upload-verification', photoUrl, photoFilename }),
      });
      const data = await safeParseJsonResponse(res);
      if (!res.ok) throw new Error(data.message || 'Failed to attach verification photo');
      setActionMessage({ type: 'success', text: 'Verification photo uploaded' });
      setVerifyFile(null);
      setVerifyPreview(null);
      if (data.data?.complaint) setComplaint(data.data.complaint);
      if (typeof onUpdated === 'function') onUpdated();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Upload failed' });
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!complaint?.id || resolveLoading) return;
    setResolveLoading(true);
    setActionMessage(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/complaints/${complaint.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ status: 'Resolved' }),
      });
      const data = await safeParseJsonResponse(res);
      if (!res.ok) throw new Error(data.message || 'Failed to resolve');
      setActionMessage({ type: 'success', text: 'Complaint marked as resolved' });
      if (data.data?.complaint) {
        setComplaint(data.data.complaint);
      } else {
        setComplaint((prev) => ({ ...prev, status: 'Resolved' }));
      }
      if (typeof onUpdated === 'function') onUpdated();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Resolve failed' });
    } finally {
      setResolveLoading(false);
    }
  };

  const handleReject = async () => {
    if (!complaint?.id || rejectLoading) return;
    setRejectLoading(true);
    setActionMessage(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/complaints/${complaint.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ status: 'Rejected' }),
      });
      const data = await safeParseJsonResponse(res);
      if (!res.ok) throw new Error(data.message || 'Failed to reject');
      setActionMessage({ type: 'success', text: 'Complaint rejected as duplicate' });
      if (data.data?.complaint) {
        setComplaint(data.data.complaint);
      } else {
        setComplaint((prev) => ({ ...prev, status: 'Rejected' }));
      }
      if (typeof onUpdated === 'function') onUpdated();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Reject failed' });
    } finally {
      setRejectLoading(false);
    }
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleString() : '—');

  const buildMapUrl = (lat, lng) => {
    if (!lat || !lng) return null;
    return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=400x200&maptype=roadmap&markers=color:red%7C${lat},${lng}&style=feature:all|element:labels|visibility:on`;
  };

  const buildOSMUrl = (lat, lng) => {
    if (!lat || !lng) return null;
    return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=15&size=400x200&markers=${lat},${lng},red-pushpin`;
  };

  const statusIndex = complaint ? STATUS_OPTIONS.indexOf(complaint.status) : -1;
  const remarks = complaint?.remarks || [];
  const timeline = complaint?.statusHistory || complaint?.timeline || [];

  if (loading) {
    return (
      <div className="cd-panel">
        <div className="cd-loading">Loading complaint details…</div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="cd-panel">
        <div className="cd-error">{error || 'Complaint not found'}</div>
        <button className="cd-back-btn" onClick={onBack}>
          <ArrowLeft size={16} /> Back
        </button>
        <style jsx>{styles}</style>
      </div>
    );
  }

  return (
    <div className="cd-panel">
      <button className="cd-back-btn" onClick={onBack}>
        <ArrowLeft size={16} /> Back to list
      </button>

      <div className="cd-card">
        <header className="cd-header">
          <div className="cd-header-left">
            <span className="cd-category-icon">
              {CATEGORY_ICONS[complaint.category] || '📋'}
            </span>
            <div>
              <h2 className="cd-title">
                {complaint.category || 'General Complaint'}
              </h2>
              <span className="cd-id">#{complaint.id}</span>
            </div>
          </div>
          <span
            className="cd-status-chip"
            style={{
              background: STATUS_COLORS[complaint.status]?.bg || '#f1f5f9',
              color: STATUS_COLORS[complaint.status]?.text || '#475569',
              borderColor: STATUS_COLORS[complaint.status]?.border || '#94a3b8',
            }}
          >
            {complaint.status || 'Pending'}
          </span>
        </header>

        {complaint.photoUrl && (
          <div className="cd-photo-section">
            <img
              src={complaint.photoUrl}
              alt={`Complaint ${complaint.id} photo`}
              className="cd-photo"
            />
          </div>
        )}

        <div className="cd-grid">
          <div className="cd-detail-card">
            <span className="cd-detail-label">Description</span>
            <p className="cd-detail-value cd-description">
              {complaint.description || 'No description provided.'}
            </p>
          </div>

          <div className="cd-detail-card">
            <span className="cd-detail-label">Location</span>
            <div className="cd-detail-value">
              <div className="cd-location-row">
                <MapPin size={14} className="cd-icon" />
                <span>{complaint.address || 'No address provided'}</span>
              </div>
              {complaint.latitude && complaint.longitude && (
                <div className="cd-coords">
                  {Number(complaint.latitude).toFixed(6)}, {Number(complaint.longitude).toFixed(6)}
                </div>
              )}
            </div>
          </div>

          <div className="cd-detail-card">
            <span className="cd-detail-label">Details</span>
            <div className="cd-detail-value">
              <div className="cd-info-row">
                <Calendar size={14} className="cd-icon" />
                <span>{formatDate(complaint.createdAt || complaint.date)}</span>
              </div>
              {complaint.corporation && (
                <div className="cd-info-row">
                  <Building2 size={14} className="cd-icon" />
                  <span>{complaint.corporation}</span>
                </div>
              )}
              {complaint.ward && (
                <div className="cd-info-row">
                  <Landmark size={14} className="cd-icon" />
                  <span>Ward {complaint.ward}</span>
                </div>
              )}
            </div>
          </div>

          {complaint.latitude && complaint.longitude && (
            <div className="cd-detail-card">
              <span className="cd-detail-label">Map</span>
              <div className="cd-map-container">
                <img
                  src={buildOSMUrl(complaint.latitude, complaint.longitude)}
                  alt="Complaint location map"
                  className="cd-map-image"
                  onError={(e) => {
                    e.target.src = `https://maps.googleapis.com/maps/api/staticmap?center=${complaint.latitude},${complaint.longitude}&zoom=15&size=400x200&maptype=roadmap&markers=color:red%7C${complaint.latitude},${complaint.longitude}`;
                  }}
                />
                <div className="cd-map-overlay">
                  <MapPin size={20} className="cd-map-pin" />
                </div>
                <a
                  href={`https://www.google.com/maps?q=${complaint.latitude},${complaint.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cd-map-link"
                >
                  Open in Google Maps
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Timeline */}
      <div className="cd-card">
        <h3 className="cd-section-title">Status Timeline</h3>
        <div className="cd-timeline">
          {timeline.length > 0
            ? timeline.map((entry, idx) => (
                <div key={idx} className="cd-timeline-item">
                  <div className="cd-timeline-dot-line">
                    <div
                      className="cd-timeline-dot"
                      style={{
                        background: STATUS_COLORS[entry.status]?.border || '#94a3b8',
                      }}
                    />
                    {idx < timeline.length - 1 && <div className="cd-timeline-line" />}
                  </div>
                  <div className="cd-timeline-content">
                    <div className="cd-timeline-header">
                      <span
                        className="cd-timeline-badge"
                        style={{
                          background: STATUS_COLORS[entry.status]?.bg || '#f1f5f9',
                          color: STATUS_COLORS[entry.status]?.text || '#475569',
                          borderColor: STATUS_COLORS[entry.status]?.border || '#94a3b8',
                        }}
                      >
                        {entry.status}
                      </span>
                      <span className="cd-timeline-date">
                        {formatDate(entry.date || entry.timestamp)}
                      </span>
                    </div>
                    {entry.remark && (
                      <p className="cd-timeline-remark">{entry.remark}</p>
                    )}
                  </div>
                </div>
              ))
            : STATUS_OPTIONS.map((s, idx) => {
                const isComplete = statusIndex >= idx;
                const isCurrent = s === complaint.status;
                return (
                  <div
                    key={s}
                    className={`cd-timeline-item ${isCurrent ? 'cd-timeline-item--current' : ''}`}
                  >
                    <div className="cd-timeline-dot-line">
                      <div
                        className="cd-timeline-dot"
                        style={{
                          background: isComplete
                            ? STATUS_COLORS[s]?.border || '#10b981'
                            : '#d1d5db',
                        }}
                      />
                      {idx < STATUS_OPTIONS.length - 1 && (
                        <div
                          className="cd-timeline-line"
                          style={{
                            background: isComplete
                              ? STATUS_COLORS[s]?.border || '#10b981'
                              : '#e5e7eb',
                          }}
                        />
                      )}
                    </div>
                    <div className="cd-timeline-content">
                      <span
                        className="cd-timeline-badge"
                        style={{
                          background: isComplete ? STATUS_COLORS[s]?.bg : '#f9fafb',
                          color: isComplete ? STATUS_COLORS[s]?.text : '#9ca3af',
                          borderColor: isComplete ? STATUS_COLORS[s]?.border : '#d1d5db',
                        }}
                      >
                        {s}
                        {isCurrent && ' (current)'}
                      </span>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>

      {/* Admin Remarks */}
      <div className="cd-card">
        <h3 className="cd-section-title">
          <MessageSquare size={18} className="cd-section-icon" />
          Admin Remarks
        </h3>
        {remarks.length === 0 ? (
          <p className="cd-empty">No remarks yet.</p>
        ) : (
          <div className="cd-remarks-list">
            {remarks.map((remark, idx) => (
              <div key={idx} className="cd-remark-item">
                <div className="cd-remark-header">
                  <span className="cd-remark-author">{remark.author || remark.authorName || 'Admin'}</span>
                  <span className="cd-remark-date">{formatDate(remark.date || remark.createdAt)}</span>
                </div>
                <p className="cd-remark-text">{remark.text || remark.remark || remark.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin Action Panel */}
      {isAdmin && (
        <div className="cd-card cd-admin-panel">
          <h3 className="cd-section-title">
            <AlertTriangle size={18} className="cd-section-icon" />
            Admin Actions
          </h3>

          <div className="cd-admin-grid">
            <div className="cd-action-group">
              <label className="cd-action-label">Update Status</label>
              <div className="cd-action-row">
                <select
                  className="cd-select"
                  defaultValue={complaint.status || 'Pending'}
                  disabled={statusLoading}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button
                  className="cd-btn cd-btn--primary"
                  onClick={(e) => {
                    const select = e.currentTarget.previousElementSibling;
                    handleUpdateStatus(select.value);
                  }}
                  disabled={statusLoading}
                >
                  <Clock size={14} />
                  {statusLoading ? 'Updating…' : 'Update'}
                </button>
              </div>
            </div>

            <div className="cd-action-group">
              <label className="cd-action-label">Add Remark</label>
              <textarea
                className="cd-textarea"
                placeholder="Write an admin remark…"
                value={remarkText}
                onChange={(e) => setRemarkText(e.target.value)}
                rows={3}
                disabled={remarkLoading}
              />
              <button
                className="cd-btn cd-btn--secondary"
                onClick={handleAddRemark}
                disabled={remarkLoading || !remarkText.trim()}
              >
                <MessageSquare size={14} />
                {remarkLoading ? 'Adding…' : 'Add Remark'}
              </button>
            </div>

            <div className="cd-action-group">
              <label className="cd-action-label">Verification Photo</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="cd-file-input"
                onChange={handleVerifyFileSelect}
                style={{ display: 'none' }}
              />
              {verifyPreview && (
                <div className="cd-verify-preview">
                  <img src={verifyPreview} alt="Verification preview" />
                  <button
                    className="cd-verify-remove"
                    onClick={() => {
                      setVerifyFile(null);
                      setVerifyPreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}
              <div className="cd-action-row">
                <button
                  className="cd-btn cd-btn--outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={verifyLoading}
                >
                  <Upload size={14} />
                  Choose Photo
                </button>
                <button
                  className="cd-btn cd-btn--primary"
                  onClick={handleUploadVerification}
                  disabled={verifyLoading || !verifyFile}
                >
                  <ImageIcon size={14} />
                  {verifyLoading ? 'Uploading…' : 'Upload'}
                </button>
              </div>
            </div>

            <div className="cd-action-group cd-action-group--buttons">
              <button
                className="cd-btn cd-btn--resolve"
                onClick={handleResolve}
                disabled={resolveLoading || complaint.status === 'Resolved'}
              >
                <CheckCircle size={14} />
                {resolveLoading ? 'Resolving…' : 'Mark Resolved'}
              </button>
              <button
                className="cd-btn cd-btn--reject"
                onClick={handleReject}
                disabled={rejectLoading || complaint.status === 'Rejected'}
              >
                <XCircle size={14} />
                {rejectLoading ? 'Rejecting…' : 'Reject (Duplicate)'}
              </button>
            </div>
          </div>

          {actionMessage && (
            <div className={`cd-action-msg cd-action-msg--${actionMessage.type}`}>
              {actionMessage.text}
            </div>
          )}
        </div>
      )}

      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
  .cd-panel {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .cd-back-btn {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    border: none;
    background: none;
    color: #059669;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    padding: 0.5rem 0;
    transition: color 0.2s;
  }

  .cd-back-btn:hover {
    color: #047857;
  }

  .cd-card {
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 1.25rem;
    padding: 1.75rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .cd-loading,
  .cd-error {
    padding: 2rem;
    text-align: center;
    color: #64748b;
    font-weight: 500;
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 1.25rem;
  }

  .cd-error {
    color: #dc2626;
  }

  .cd-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .cd-header-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .cd-category-icon {
    font-size: 1.75rem;
    line-height: 1;
  }

  .cd-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
  }

  .cd-id {
    font-size: 0.85rem;
    color: #94a3b8;
    font-weight: 500;
  }

  .cd-status-chip {
    display: inline-flex;
    align-items: center;
    padding: 0.4rem 1rem;
    border-radius: 2rem;
    font-size: 0.85rem;
    font-weight: 600;
    border: 2px solid;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .cd-photo-section {
    width: 100%;
    overflow: hidden;
    border-radius: 0.75rem;
  }

  .cd-photo {
    width: 100%;
    max-height: 320px;
    object-fit: cover;
    display: block;
    border-radius: 0.75rem;
  }

  .cd-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.25rem;
  }

  .cd-detail-card {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .cd-detail-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #059669;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .cd-detail-value {
    font-size: 0.95rem;
    color: #334155;
    line-height: 1.55;
  }

  .cd-description {
    white-space: pre-wrap;
    word-break: break-word;
  }

  .cd-location-row,
  .cd-info-row {
    display: flex;
    align-items: flex-start;
    gap: 0.4rem;
    margin-bottom: 0.3rem;
  }

  .cd-icon {
    color: #059669;
    margin-top: 2px;
    flex-shrink: 0;
  }

  .cd-coords {
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 0.82rem;
    color: #64748b;
    margin-top: 0.25rem;
  }

  .cd-map-container {
    position: relative;
    border-radius: 0.75rem;
    overflow: hidden;
    background: #f1f5f9;
    min-height: 180px;
  }

  .cd-map-image {
    width: 100%;
    height: 200px;
    object-fit: cover;
    display: block;
  }

  .cd-map-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -100%);
    pointer-events: none;
  }

  .cd-map-pin {
    color: #dc2626;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  }

  .cd-map-link {
    display: block;
    text-align: center;
    padding: 0.5rem;
    font-size: 0.82rem;
    color: #059669;
    font-weight: 600;
    text-decoration: none;
    background: white;
    border-top: 1px solid #e2e8f0;
    transition: background 0.2s;
  }

  .cd-map-link:hover {
    background: #ecfdf5;
  }

  .cd-section-title {
    font-size: 1.15rem;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .cd-section-icon {
    color: #059669;
  }

  .cd-empty {
    color: #94a3b8;
    font-size: 0.95rem;
    margin: 0;
  }

  .cd-timeline {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .cd-timeline-item {
    display: flex;
    gap: 1rem;
    min-height: 3rem;
  }

  .cd-timeline-item--current .cd-timeline-content {
    background: #ecfdf5;
    border-color: #a7f3d0;
  }

  .cd-timeline-dot-line {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 1.25rem;
    flex-shrink: 0;
    padding-top: 0.3rem;
  }

  .cd-timeline-dot {
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 50%;
    flex-shrink: 0;
    border: 2px solid white;
    box-shadow: 0 0 0 2px #e5e7eb;
  }

  .cd-timeline-line {
    width: 2px;
    flex-grow: 1;
    background: #e5e7eb;
    margin: 4px 0;
  }

  .cd-timeline-content {
    padding: 0.6rem 1rem;
    border-radius: 0.75rem;
    border: 1px solid #f1f5f9;
    flex-grow: 1;
    margin-bottom: 0.5rem;
  }

  .cd-timeline-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .cd-timeline-badge {
    display: inline-flex;
    padding: 0.2rem 0.65rem;
    border-radius: 1rem;
    font-size: 0.78rem;
    font-weight: 600;
    border: 1px solid;
  }

  .cd-timeline-date {
    font-size: 0.8rem;
    color: #94a3b8;
  }

  .cd-timeline-remark {
    font-size: 0.9rem;
    color: #475569;
    margin: 0.5rem 0 0 0;
    line-height: 1.5;
  }

  .cd-remarks-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .cd-remark-item {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 0.75rem;
    padding: 1rem 1.25rem;
  }

  .cd-remark-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.4rem;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .cd-remark-author {
    font-weight: 600;
    font-size: 0.9rem;
    color: #0f172a;
  }

  .cd-remark-date {
    font-size: 0.8rem;
    color: #94a3b8;
  }

  .cd-remark-text {
    font-size: 0.95rem;
    color: #334155;
    line-height: 1.55;
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .cd-admin-panel {
    border-color: #d1fae5;
    background: linear-gradient(to bottom right, #ffffff, #ecfdf5);
  }

  .cd-admin-grid {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .cd-action-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .cd-action-group--buttons {
    flex-direction: row;
    gap: 0.75rem;
    flex-wrap: wrap;
    padding-top: 0.5rem;
    border-top: 1px solid #e2e8f0;
  }

  .cd-action-label {
    font-size: 0.85rem;
    font-weight: 600;
    color: #0f172a;
  }

  .cd-action-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .cd-select {
    flex: 1;
    min-width: 160px;
    border-radius: 0.75rem;
    border: 2px solid #d1d5db;
    padding: 0.65rem 1rem;
    font-size: 0.9rem;
    background: white;
    color: #0f172a;
    cursor: pointer;
    transition: border-color 0.2s;
    font-family: inherit;
  }

  .cd-select:focus {
    outline: none;
    border-color: #059669;
    box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.12);
  }

  .cd-textarea {
    width: 100%;
    border-radius: 0.75rem;
    border: 2px solid #d1d5db;
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
    font-family: inherit;
    resize: vertical;
    min-height: 80px;
    color: #0f172a;
    background: white;
    transition: border-color 0.2s;
    box-sizing: border-box;
  }

  .cd-textarea:focus {
    outline: none;
    border-color: #059669;
    box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.12);
  }

  .cd-textarea::placeholder {
    color: #94a3b8;
  }

  .cd-file-input {
    display: none;
  }

  .cd-verify-preview {
    position: relative;
    display: inline-block;
    max-width: 200px;
    border-radius: 0.5rem;
    overflow: hidden;
    border: 2px solid #d1fae5;
  }

  .cd-verify-preview img {
    display: block;
    width: 100%;
    height: auto;
  }

  .cd-verify-remove {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    border: none;
    font-size: 0.7rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }

  .cd-verify-remove:hover {
    background: rgba(0, 0, 0, 0.8);
  }

  .cd-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    border: none;
    border-radius: 0.75rem;
    padding: 0.65rem 1.1rem;
    font-weight: 600;
    font-size: 0.88rem;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
    white-space: nowrap;
    font-family: inherit;
  }

  .cd-btn:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .cd-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .cd-btn--primary {
    background: linear-gradient(135deg, #059669, #047857);
    color: white;
  }

  .cd-btn--primary:hover:not(:disabled) {
    box-shadow: 0 6px 14px rgba(5, 150, 105, 0.3);
  }

  .cd-btn--secondary {
    background: #ecfdf5;
    color: #047857;
    border: 2px solid #a7f3d0;
  }

  .cd-btn--secondary:hover:not(:disabled) {
    background: #d1fae5;
  }

  .cd-btn--outline {
    background: white;
    color: #059669;
    border: 2px solid #a7f3d0;
  }

  .cd-btn--outline:hover:not(:disabled) {
    background: #ecfdf5;
  }

  .cd-btn--resolve {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
  }

  .cd-btn--resolve:hover:not(:disabled) {
    box-shadow: 0 6px 14px rgba(16, 185, 129, 0.3);
  }

  .cd-btn--reject {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
  }

  .cd-btn--reject:hover:not(:disabled) {
    box-shadow: 0 6px 14px rgba(239, 68, 68, 0.3);
  }

  .cd-action-msg {
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    font-weight: 500;
    font-size: 0.9rem;
    margin-top: 0.5rem;
  }

  .cd-action-msg--success {
    background: #d1fae5;
    color: #065f46;
    border: 1px solid #a7f3d0;
  }

  .cd-action-msg--error {
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fca5a5;
  }

  @media (max-width: 768px) {
    .cd-card {
      padding: 1.5rem;
    }
    .cd-grid {
      grid-template-columns: 1fr;
    }
    .cd-header {
      flex-direction: column;
    }
    .cd-action-group--buttons {
      flex-direction: column;
    }
    .cd-btn {
      width: 100%;
      justify-content: center;
    }
  }

  @media (max-width: 480px) {
    .cd-card {
      padding: 1.25rem;
      border-radius: 1rem;
    }
    .cd-title {
      font-size: 1.25rem;
    }
    .cd-back-btn {
      font-size: 0.9rem;
    }
  }
`;
