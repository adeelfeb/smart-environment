'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { safeParseJsonResponse } from '../../utils/safeJsonResponse';

function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    credentials: 'include',
  };
}

export default function CorporationsPanel({ user }) {
  const [corporations, setCorporations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showCorpModal, setShowCorpModal] = useState(false);
  const [editingCorp, setEditingCorp] = useState(null);
  const [corpForm, setCorpForm] = useState({ name: '', state: '', district: '' });
  const [corpSaving, setCorpSaving] = useState(false);

  const [expandedCorpId, setExpandedCorpId] = useState(null);

  const fetchCorporations = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/corporations?includeInactive=true', {
        headers: authHeaders(),
        credentials: 'include',
      });
      const data = await safeParseJsonResponse(res);
      if (data.success && data.data) {
        setCorporations(data.data.corporations || data.data || []);
      } else {
        setError(data.message || 'Failed to load corporations');
      }
    } catch (err) {
      setError('Unable to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCorporations();
  }, [fetchCorporations]);

  const openAddCorp = () => {
    setEditingCorp(null);
    setCorpForm({ name: '', state: '', district: '' });
    setShowCorpModal(true);
  };

  const openEditCorp = (corp) => {
    setEditingCorp(corp);
    setCorpForm({ name: corp.name || '', state: corp.state || '', district: corp.district || '' });
    setShowCorpModal(true);
  };

  const handleCorpSave = async (e) => {
    e.preventDefault();
    if (!corpForm.name.trim()) return;
    setCorpSaving(true);
    try {
      const isEdit = !!editingCorp;
      const url = isEdit ? `/api/corporations/${editingCorp._id || editingCorp.id}` : '/api/corporations';
      const method = isEdit ? 'PUT' : 'POST';
      const body = isEdit
        ? { name: corpForm.name.trim(), state: corpForm.state.trim(), district: corpForm.district.trim() }
        : { name: corpForm.name.trim(), state: corpForm.state.trim(), district: corpForm.district.trim() };

      const res = await fetch(url, { method, headers: authHeaders(), credentials: 'include', body: JSON.stringify(body) });
      const data = await safeParseJsonResponse(res);
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save corporation');
      }
      setShowCorpModal(false);
      fetchCorporations();
    } catch (err) {
      setError(err.message);
    } finally {
      setCorpSaving(false);
    }
  };

  const toggleCorpActive = async (corp) => {
    try {
      const res = await fetch(`/api/corporations/${corp._id || corp.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify({ isActive: !corp.isActive }),
      });
      const data = await safeParseJsonResponse(res);
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update corporation');
      }
      fetchCorporations();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleExpandCorp = (corpId) => {
    setExpandedCorpId(expandedCorpId === corpId ? null : corpId);
  };

  return (
    <div className="corp-panel">
      <header className="corp-panel-header">
        <div>
          <h2 className="corp-panel-title">Corporation Management</h2>
          <p className="corp-panel-sub">Manage corporations and their wards</p>
        </div>
        <div className="corp-panel-header-actions">
          <button className="corp-btn corp-btn-refresh" onClick={fetchCorporations} disabled={loading}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            Refresh
          </button>
          <button className="corp-btn corp-btn-primary" onClick={openAddCorp}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Corporation
          </button>
        </div>
      </header>

      {error && <div className="corp-alert">{error}</div>}

      {loading ? (
        <div className="corp-loading">
          <div className="corp-spinner" />
          <span>Loading corporations…</span>
        </div>
      ) : corporations.length === 0 ? (
        <div className="corp-empty">No corporations found. Add one to get started.</div>
      ) : (
        <div className="corp-grid">
          {corporations.map((corp) => (
            <CorporationCard
              key={corp._id || corp.id}
              corp={corp}
              expanded={expandedCorpId === (corp._id || corp.id)}
              onToggleExpand={toggleExpandCorp}
              onEdit={openEditCorp}
              onToggleActive={toggleCorpActive}
            />
          ))}
        </div>
      )}

      {showCorpModal && (
        <div className="corp-modal-overlay" onClick={() => setShowCorpModal(false)}>
          <div className="corp-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="corp-modal-title">{editingCorp ? 'Edit Corporation' : 'Add Corporation'}</h3>
            <form onSubmit={handleCorpSave}>
              <label className="corp-field">
                <span className="corp-field-label">Name</span>
                <input
                  type="text"
                  value={corpForm.name}
                  onChange={(e) => setCorpForm({ ...corpForm, name: e.target.value })}
                  placeholder="Corporation name"
                  required
                />
              </label>
              <label className="corp-field">
                <span className="corp-field-label">State</span>
                <input
                  type="text"
                  value={corpForm.state}
                  onChange={(e) => setCorpForm({ ...corpForm, state: e.target.value })}
                  placeholder="State"
                />
              </label>
              <label className="corp-field">
                <span className="corp-field-label">District</span>
                <input
                  type="text"
                  value={corpForm.district}
                  onChange={(e) => setCorpForm({ ...corpForm, district: e.target.value })}
                  placeholder="District"
                />
              </label>
              <div className="corp-modal-actions">
                <button type="button" className="corp-btn corp-btn-cancel" onClick={() => setShowCorpModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="corp-btn corp-btn-primary" disabled={corpSaving || !corpForm.name.trim()}>
                  {corpSaving ? 'Saving…' : editingCorp ? 'Save Changes' : 'Add Corporation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .corp-panel {
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .corp-panel-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .corp-panel-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #02201a;
          margin: 0;
        }
        .corp-panel-sub {
          font-size: 0.85rem;
          color: #64748b;
          margin: 4px 0 0;
        }
        .corp-panel-header-actions {
          display: flex;
          gap: 10px;
          flex-shrink: 0;
        }
        .corp-btn {
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          border: 1px solid #d1d5db;
          background: #fff;
          color: #02201a;
          transition: all 0.15s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .corp-btn:hover { background: #f9fafb; }
        .corp-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .corp-btn-primary {
          background: #10b981;
          color: #fff;
          border-color: #10b981;
        }
        .corp-btn-primary:hover { background: #059669; }
        .corp-btn-primary:disabled { background: #6ee7b7; border-color: #6ee7b7; }
        .corp-btn-refresh { background: #fff; }
        .corp-btn-cancel { background: #fff; }
        .corp-btn-edit {
          background: #fff;
          border-color: #d1d5db;
          color: #334155;
        }
        .corp-btn-edit:hover { background: #f1f5f9; }
        .corp-btn-deactivate {
          background: #fff;
          border-color: #fca5a5;
          color: #dc2626;
        }
        .corp-btn-deactivate:hover { background: #fef2f2; }
        .corp-btn-activate {
          background: #fff;
          border-color: #86efac;
          color: #16a34a;
        }
        .corp-btn-activate:hover { background: #f0fdf4; }
        .corp-btn-sm {
          padding: 5px 12px;
          font-size: 0.78rem;
        }
        .corp-alert {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 20px;
          font-size: 0.85rem;
        }
        .corp-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 48px 0;
          color: #64748b;
          font-size: 0.9rem;
        }
        .corp-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #e2e8f0;
          border-top-color: #10b981;
          border-radius: 50%;
          animation: corp-spin 0.7s linear infinite;
        }
        @keyframes corp-spin {
          to { transform: rotate(360deg); }
        }
        .corp-empty {
          text-align: center;
          color: #94a3b8;
          padding: 48px 0;
          font-size: 0.9rem;
        }

        .corp-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 16px;
        }

        .corp-card {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03);
          overflow: hidden;
          transition: box-shadow 0.15s;
        }
        .corp-card:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04);
        }
        .corp-card-main {
          padding: 16px;
          cursor: pointer;
        }
        .corp-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 8px;
        }
        .corp-card-name {
          font-size: 1rem;
          font-weight: 600;
          color: #02201a;
          margin: 0;
        }
        .corp-chip {
          font-size: 0.7rem;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 99px;
          white-space: nowrap;
          flex-shrink: 0;
          text-transform: capitalize;
        }
        .corp-chip-active {
          background: #d1fae5;
          color: #065f46;
        }
        .corp-chip-inactive {
          background: #fee2e2;
          color: #991b1b;
        }
        .corp-card-meta {
          display: flex;
          gap: 16px;
          font-size: 0.8rem;
          color: #64748b;
          margin-top: 4px;
        }
        .corp-meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .corp-card-actions {
          display: flex;
          gap: 6px;
          padding: 10px 16px;
          border-top: 1px solid #f1f5f9;
          background: #f9fafb;
        }

        .corp-wards-section {
          border-top: 1px solid #e5e7eb;
          padding: 16px;
          background: #f9fafb;
        }
        .corp-wards-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .corp-wards-title {
          font-size: 0.85rem;
          font-weight: 600;
          color: #02201a;
          margin: 0;
        }
        .corp-ward-add-form {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }
        .corp-ward-add-form input {
          flex: 1;
          padding: 6px 10px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.8rem;
          background: #fff;
          color: #02201a;
        }
        .corp-ward-add-form input:focus {
          outline: none;
          border-color: #10b981;
          box-shadow: 0 0 0 2px rgba(16,185,129,0.15);
        }
        .corp-ward-add-form input::placeholder {
          color: #94a3b8;
        }
        .corp-ward-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .corp-ward-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 10px;
          border-radius: 6px;
          gap: 8px;
        }
        .corp-ward-item:hover {
          background: #fff;
        }
        .corp-ward-info {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .corp-ward-name {
          font-size: 0.82rem;
          font-weight: 500;
          color: #02201a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .corp-ward-number {
          font-size: 0.75rem;
          color: #64748b;
          white-space: nowrap;
        }
        .corp-ward-chip {
          font-size: 0.65rem;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 99px;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .corp-ward-chip-active {
          background: #d1fae5;
          color: #065f46;
        }
        .corp-ward-chip-inactive {
          background: #fee2e2;
          color: #991b1b;
        }
        .corp-ward-actions {
          display: flex;
          gap: 4px;
          flex-shrink: 0;
        }
        .corp-ward-edit-form {
          display: flex;
          gap: 6px;
          align-items: center;
        }
        .corp-ward-edit-form input {
          padding: 4px 8px;
          border: 1px solid #d1d5db;
          border-radius: 5px;
          font-size: 0.78rem;
          background: #fff;
          color: #02201a;
          width: 120px;
        }
        .corp-ward-edit-form input:focus {
          outline: none;
          border-color: #10b981;
          box-shadow: 0 0 0 2px rgba(16,185,129,0.15);
        }
        .corp-wards-empty {
          color: #94a3b8;
          font-size: 0.8rem;
          text-align: center;
          padding: 16px 0;
        }
        .corp-wards-loading {
          color: #94a3b8;
          font-size: 0.8rem;
          text-align: center;
          padding: 12px 0;
        }

        .corp-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
        }
        .corp-modal {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.15);
          width: 100%;
          max-width: 440px;
          padding: 24px;
        }
        .corp-modal-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #02201a;
          margin: 0 0 20px;
        }
        .corp-field {
          display: block;
          margin-bottom: 16px;
        }
        .corp-field-label {
          display: block;
          font-size: 0.8rem;
          font-weight: 500;
          color: #334155;
          margin-bottom: 4px;
        }
        .corp-field input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 0.85rem;
          color: #02201a;
          background: #fff;
          box-sizing: border-box;
        }
        .corp-field input:focus {
          outline: none;
          border-color: #10b981;
          box-shadow: 0 0 0 2px rgba(16,185,129,0.15);
        }
        .corp-field input::placeholder {
          color: #94a3b8;
        }
        .corp-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 20px;
        }

        @media (max-width: 768px) {
          .corp-panel { padding: 16px; }
          .corp-grid {
            grid-template-columns: 1fr;
          }
          .corp-panel-header {
            flex-direction: column;
            align-items: stretch;
          }
          .corp-panel-header-actions {
            justify-content: flex-start;
          }
          .corp-ward-add-form {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}

function CorporationCard({ corp, expanded, onToggleExpand, onEdit, onToggleActive }) {
  const corpId = corp._id || corp.id;
  const [wards, setWards] = useState([]);
  const [wardsLoading, setWardsLoading] = useState(false);
  const [wardsError, setWardsError] = useState('');

  const [wardFormOpen, setWardFormOpen] = useState(false);
  const [wardForm, setWardForm] = useState({ name: '', wardNumber: '' });
  const [wardSaving, setWardSaving] = useState(false);

  const [editingWardId, setEditingWardId] = useState(null);
  const [editWardForm, setEditWardForm] = useState({ name: '', wardNumber: '' });

  const fetchWards = useCallback(async () => {
    try {
      setWardsLoading(true);
      setWardsError('');
      const res = await fetch(`/api/wards?corporation=${corpId}&includeInactive=true`, {
        headers: authHeaders(),
        credentials: 'include',
      });
      const data = await safeParseJsonResponse(res);
      if (data.success && data.data) {
        setWards(data.data.wards || data.data || []);
      } else {
        setWardsError(data.message || 'Failed to load wards');
      }
    } catch (err) {
      setWardsError('Unable to load wards');
    } finally {
      setWardsLoading(false);
    }
  }, [corpId]);

  useEffect(() => {
    if (expanded) fetchWards();
  }, [expanded, fetchWards]);

  const handleAddWard = async (e) => {
    e.preventDefault();
    if (!wardForm.name.trim() || !wardForm.wardNumber.toString().trim()) return;
    setWardSaving(true);
    try {
      const res = await fetch('/api/wards', {
        method: 'POST',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          name: wardForm.name.trim(),
          corporation: corpId,
          wardNumber: wardForm.wardNumber.toString().trim(),
        }),
      });
      const data = await safeParseJsonResponse(res);
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to add ward');
      }
      setWardForm({ name: '', wardNumber: '' });
      setWardFormOpen(false);
      fetchWards();
    } catch (err) {
      setWardsError(err.message);
    } finally {
      setWardSaving(false);
    }
  };

  const startEditWard = (ward) => {
    setEditingWardId(ward._id || ward.id);
    setEditWardForm({ name: ward.name || '', wardNumber: ward.wardNumber || '' });
  };

  const cancelEditWard = () => {
    setEditingWardId(null);
    setEditWardForm({ name: '', wardNumber: '' });
  };

  const handleSaveWard = async (wardId) => {
    if (!editWardForm.name.trim() || !editWardForm.wardNumber.toString().trim()) return;
    try {
      const res = await fetch(`/api/wards/${wardId}`, {
        method: 'PUT',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          name: editWardForm.name.trim(),
          wardNumber: editWardForm.wardNumber.toString().trim(),
        }),
      });
      const data = await safeParseJsonResponse(res);
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update ward');
      }
      cancelEditWard();
      fetchWards();
    } catch (err) {
      setWardsError(err.message);
    }
  };

  const handleToggleWardActive = async (ward) => {
    try {
      const res = await fetch(`/api/wards/${ward._id || ward.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify({ isActive: !ward.isActive }),
      });
      const data = await safeParseJsonResponse(res);
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update ward');
      }
      fetchWards();
    } catch (err) {
      setWardsError(err.message);
    }
  };

  return (
    <div className="corp-card">
      <div className="corp-card-main" onClick={() => onToggleExpand(corpId)}>
        <div className="corp-card-top">
          <h3 className="corp-card-name">{corp.name}</h3>
          <span className={`corp-chip ${corp.isActive !== false ? 'corp-chip-active' : 'corp-chip-inactive'}`}>
            {corp.isActive !== false ? 'Active' : 'Deactivated'}
          </span>
        </div>
        <div className="corp-card-meta">
          {corp.state && (
            <span className="corp-meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              {corp.state}
            </span>
          )}
          {corp.district && (
            <span className="corp-meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18"></path>
                <path d="M5 21V7l8-4v18"></path>
                <path d="M19 21V11l-6-4"></path>
                <path d="M9 9v.01"></path>
                <path d="M9 12v.01"></path>
                <path d="M9 15v.01"></path>
              </svg>
              {corp.district}
            </span>
          )}
        </div>
      </div>

      <div className="corp-card-actions">
        <button className="corp-btn corp-btn-sm corp-btn-edit" onClick={() => onEdit(corp)}>
          Edit
        </button>
        <button
          className={`corp-btn corp-btn-sm ${corp.isActive !== false ? 'corp-btn-deactivate' : 'corp-btn-activate'}`}
          onClick={() => onToggleActive(corp)}
        >
          {corp.isActive !== false ? 'Deactivate' : 'Activate'}
        </button>
      </div>

      {expanded && (
        <div className="corp-wards-section">
          <div className="corp-wards-header">
            <h4 className="corp-wards-title">Wards</h4>
            <button
              className="corp-btn corp-btn-sm corp-btn-primary"
              onClick={() => setWardFormOpen(!wardFormOpen)}
            >
              {wardFormOpen ? 'Cancel' : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Add Ward
                </>
              )}
            </button>
          </div>

          {wardFormOpen && (
            <form className="corp-ward-add-form" onSubmit={handleAddWard}>
              <input
                type="text"
                placeholder="Ward name"
                value={wardForm.name}
                onChange={(e) => setWardForm({ ...wardForm, name: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Ward number"
                value={wardForm.wardNumber}
                onChange={(e) => setWardForm({ ...wardForm, wardNumber: e.target.value })}
                required
              />
              <button type="submit" className="corp-btn corp-btn-sm corp-btn-primary" disabled={wardSaving}>
                {wardSaving ? 'Saving…' : 'Add'}
              </button>
            </form>
          )}

          {wardsError && <div className="corp-alert" style={{ fontSize: '0.8rem', padding: '8px 12px', marginBottom: 8 }}>{wardsError}</div>}

          {wardsLoading ? (
            <div className="corp-wards-loading">Loading wards…</div>
          ) : wards.length === 0 ? (
            <div className="corp-wards-empty">No wards found.</div>
          ) : (
            <ul className="corp-ward-list">
              {wards.map((ward) => {
                const wardId = ward._id || ward.id;
                const isEditing = editingWardId === wardId;
                return (
                  <li key={wardId} className="corp-ward-item">
                    {isEditing ? (
                      <div className="corp-ward-edit-form">
                        <input
                          type="text"
                          value={editWardForm.name}
                          onChange={(e) => setEditWardForm({ ...editWardForm, name: e.target.value })}
                          placeholder="Name"
                        />
                        <input
                          type="text"
                          value={editWardForm.wardNumber}
                          onChange={(e) => setEditWardForm({ ...editWardForm, wardNumber: e.target.value })}
                          placeholder="Number"
                          style={{ width: 70 }}
                        />
                        <button className="corp-btn corp-btn-sm corp-btn-primary" onClick={() => handleSaveWard(wardId)}>
                          Save
                        </button>
                        <button className="corp-btn corp-btn-sm corp-btn-cancel" onClick={cancelEditWard}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="corp-ward-info">
                          <span className="corp-ward-name">{ward.name}</span>
                          <span className="corp-ward-number">#{ward.wardNumber}</span>
                          <span className={`corp-ward-chip ${ward.isActive !== false ? 'corp-ward-chip-active' : 'corp-ward-chip-inactive'}`}>
                            {ward.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="corp-ward-actions">
                          <button className="corp-btn corp-btn-sm corp-btn-edit" onClick={() => startEditWard(ward)}>
                            Edit
                          </button>
                          <button
                            className={`corp-btn corp-btn-sm ${ward.isActive !== false ? 'corp-btn-deactivate' : 'corp-btn-activate'}`}
                            onClick={() => handleToggleWardActive(ward)}
                          >
                            {ward.isActive !== false ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
