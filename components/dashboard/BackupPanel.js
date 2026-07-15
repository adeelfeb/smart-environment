import React, { useState, useRef } from 'react';
import { safeParseJsonResponse } from '../../utils/safeJsonResponse';

function DownloadIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function UploadIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

export default function BackupPanel({ user }) {
  const role = (user?.role || '').toLowerCase();
  const hasAccess = role === 'developer' || role === 'superadmin';

  const [exportFormat, setExportFormat] = useState('json');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  async function handleExport() {
    setExportError('');
    setExporting(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      const res = await fetch(`/api/backup/export?format=${encodeURIComponent(exportFormat)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await safeParseJsonResponse(res).catch(() => ({}));
        throw new Error(data.message || `Export failed (${res.status})`);
      }
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition');
      const match = disposition && disposition.match(/filename="?([^";\n]+)"?/);
      const filename = match ? match[1] : `backup-${exportFormat === 'json' ? 'data.json' : 'data.xlsx'}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    setImportFile(file || null);
    setImportError('');
    setImportResult(null);
  }

  async function handleImport() {
    if (!importFile) {
      setImportError('Please select a JSON or Excel file first.');
      return;
    }
    const name = (importFile.name || '').toLowerCase();
    const isExcel = name.endsWith('.xlsx') || name.endsWith('.xls');
    const isJson = name.endsWith('.json');
    if (!isExcel && !isJson) {
      setImportError('File must be .json or .xlsx.');
      return;
    }
    setImportError('');
    setImportResult(null);
    setImporting(true);
    try {
      const buffer = await importFile.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      const chunk = 8192;
      for (let i = 0; i < bytes.length; i += chunk) {
        const slice = bytes.subarray(i, i + chunk);
        binary += String.fromCharCode.apply(null, slice);
      }
      const base64 = typeof btoa !== 'undefined' ? btoa(binary) : Buffer.from(bytes).toString('base64');
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      const res = await fetch('/api/backup/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          format: isExcel ? 'excel' : 'json',
          content: base64,
        }),
      });
      const data = await safeParseJsonResponse(res);
      if (data.success) {
        setImportResult(data.data);
        setImportFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setImportError(data.message || 'Import failed');
      }
    } catch (err) {
      setImportError(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  }

  if (!hasAccess) {
    return (
      <div className="backup-panel">
        <div className="backup-access-denied">
          <DownloadIcon size={40} />
          <h3>Developer access required</h3>
          <p>Backup and import are only available to users with the developer or super admin role.</p>
        </div>
        <style jsx>{`
          .backup-panel { padding: 1.5rem; overflow-y: auto; flex: 1; min-height: 0; scrollbar-width: thin; scrollbar-color: rgba(148, 163, 184, 0.6) rgba(241, 245, 249, 0.8); }
          .backup-access-denied {
            text-align: center;
            padding: 3rem 2rem;
            background: linear-gradient(135deg, #f0f9ff 0%, #f8fafc 100%);
            border: 1px dashed rgba(14, 165, 233, 0.4);
            border-radius: 1rem;
            color: #64748b;
          }
          .backup-access-denied :global(svg) { color: #94a3b8; margin-bottom: 1rem; display: block; margin-left: auto; margin-right: auto; }
          .backup-access-denied h3 { margin: 0 0 0.5rem 0; font-size: 1.25rem; font-weight: 700; color: #334155; }
          .backup-access-denied p { margin: 0; font-size: 0.95rem; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="backup-panel">
      <header className="backup-header">
        <h2 className="backup-title">Database backup &amp; import</h2>
        <p className="backup-desc">
          Export all collections to a JSON or Excel file. Import a previously exported file to add entries back (invalid or duplicate entries are skipped).
        </p>
      </header>

      <div className="backup-grid">
        <section className="backup-card backup-export-card">
          <h3 className="backup-card-title">
            <DownloadIcon size={22} /> Export backup
          </h3>
          <p className="backup-card-desc">Download the full database snapshot.</p>
          <div className="backup-form-group">
            <label htmlFor="backup-format">Format</label>
            <select
              id="backup-format"
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              disabled={exporting}
              className="backup-select"
            >
              <option value="json">JSON</option>
              <option value="excel">Excel (.xlsx)</option>
            </select>
          </div>
          {exportError && <div className="backup-alert backup-alert-error" role="alert">{exportError}</div>}
          <button
            type="button"
            className="backup-btn backup-btn-primary"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? 'Exporting…' : 'Download backup'}
          </button>
        </section>

        <section className="backup-card backup-import-card">
          <h3 className="backup-card-title">
            <UploadIcon size={22} /> Import backup
          </h3>
          <p className="backup-card-desc">Upload a JSON or Excel file from a previous export. New entries will be added; invalid or duplicate rows are skipped.</p>
          <div className="backup-form-group">
            <label htmlFor="backup-file">File</label>
            <input
              id="backup-file"
              ref={fileInputRef}
              type="file"
              accept=".json,.xlsx,.xls"
              onChange={handleFileChange}
              disabled={importing}
              className="backup-file-input"
            />
            {importFile && <span className="backup-file-name">{importFile.name}</span>}
          </div>
          {importError && <div className="backup-alert backup-alert-error" role="alert">{importError}</div>}
          {importResult && (
            <div className="backup-alert backup-alert-success" role="status">
              <strong>Import complete.</strong> Inserted: {importResult.totalInserted}, skipped: {importResult.totalSkipped}.
              {importResult.totalSkipped > 0 && ' Check details below for any errors.'}
              <details className="backup-details">
                <summary>Per-collection summary</summary>
                <pre className="backup-pre">{JSON.stringify(importResult.summary, null, 2)}</pre>
              </details>
            </div>
          )}
          <button
            type="button"
            className="backup-btn backup-btn-secondary"
            onClick={handleImport}
            disabled={importing || !importFile}
          >
            {importing ? 'Importing…' : 'Import file'}
          </button>
        </section>
      </div>

      <p className="backup-note">
        Exported users do not include passwords. Imported users will get a temporary password: <code>ImportedBackup1!</code> — they should change it after first login.
      </p>

      <style jsx>{`
        .backup-panel {
          padding: 0.25rem 0;
          overflow-y: auto;
          flex: 1;
          min-height: 0;
          scrollbar-width: thin;
          scrollbar-color: rgba(148, 163, 184, 0.6) rgba(241, 245, 249, 0.8);
        }
        .backup-header {
          margin-bottom: 1.5rem;
        }
        .backup-title {
          font-size: 1.35rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 0.5rem 0;
        }
        .backup-desc {
          color: #475569;
          font-size: 0.95rem;
          line-height: 1.6;
          margin: 0;
          max-width: 56ch;
        }
        .backup-grid {
          display: grid;
          gap: 1.5rem;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        }
        .backup-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 1rem;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .backup-card-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #0f172a;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .backup-card-title :global(svg) {
          color: #0ea5e9;
          flex-shrink: 0;
        }
        .backup-card-desc {
          font-size: 0.9rem;
          color: #64748b;
          margin: 0;
          line-height: 1.5;
        }
        .backup-form-group {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .backup-form-group label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #334155;
        }
        .backup-select {
          padding: 0.5rem 0.75rem;
          border: 1px solid #cbd5e1;
          border-radius: 0.5rem;
          font-size: 0.95rem;
          max-width: 12rem;
        }
        .backup-file-input {
          font-size: 0.9rem;
          max-width: 100%;
        }
        .backup-file-name {
          font-size: 0.85rem;
          color: #64748b;
        }
        .backup-alert {
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          font-size: 0.9rem;
        }
        .backup-alert-error {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }
        .backup-alert-success {
          background: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0;
        }
        .backup-alert-success strong { display: block; margin-bottom: 0.25rem; }
        .backup-details {
          margin-top: 0.5rem;
          font-size: 0.85rem;
        }
        .backup-pre {
          margin: 0.5rem 0 0 0;
          padding: 0.75rem;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          overflow: auto;
          font-size: 0.8rem;
        }
        .backup-btn {
          padding: 0.6rem 1.2rem;
          border-radius: 0.5rem;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          border: none;
          align-self: flex-start;
        }
        .backup-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .backup-btn-primary {
          background: #0ea5e9;
          color: #fff;
        }
        .backup-btn-primary:hover:not(:disabled) {
          background: #0284c7;
        }
        .backup-btn-secondary {
          background: #334155;
          color: #f8fafc;
        }
        .backup-btn-secondary:hover:not(:disabled) {
          background: #1e293b;
        }
        .backup-note {
          margin: 1.5rem 0 0 0;
          font-size: 0.85rem;
          color: #64748b;
          line-height: 1.5;
        }
        .backup-note code {
          background: #e2e8f0;
          padding: 0.15rem 0.4rem;
          border-radius: 0.25rem;
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  );
}
