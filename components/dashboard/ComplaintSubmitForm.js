'use client';

import { useCallback, useEffect, useState } from 'react';
import { safeParseJsonResponse } from '../../utils/safeJsonResponse';

const CATEGORIES = [
  { id: 'Overflowing Dustbin', label: 'Overflowing Dustbin' },
  { id: 'Unauthorized Garbage Dumping', label: 'Unauthorized Garbage Dumping' },
  { id: 'Damaged Dustbin', label: 'Damaged Dustbin' },
  { id: 'Missing Dustbin', label: 'Missing Dustbin' },
];

const MAX_DESCRIPTION = 500;

function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    credentials: 'include',
  };
}

export default function ComplaintSubmitForm({ user, onComplaintSubmitted, formState, onFormStateChange }) {
  const [step, setStep] = useState(() => formState?.step || 1);

  const [photos, setPhotos] = useState(() => formState?.photos || []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const [gpsCoords, setGpsCoords] = useState(() => formState?.gpsCoords || { lat: 31.585075, lng: 74.311270 });
  const [address, setAddress] = useState(() => formState?.address || 'Tibbi City Police Station, Katri Shams Pir, Urban Lahore, Walled City of Lahore, Lahore, Lahore City Tehsil, Lahore District, Lahore Division, Punjab, 54100, Pakistan');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [dateTime, setDateTime] = useState(() => formState?.dateTime || new Date());

  const [corporations, setCorporations] = useState([]);
  const [selectedCorporation, setSelectedCorporation] = useState(() => formState?.selectedCorporation || '');
  const [wards, setWards] = useState([]);
  const [selectedWard, setSelectedWard] = useState(() => formState?.selectedWard || '');
  const [loadingCorporations, setLoadingCorporations] = useState(true);
  const [loadingWards, setLoadingWards] = useState(false);

  const [category, setCategory] = useState(() => formState?.category || '');
  const [description, setDescription] = useState(() => formState?.description || '');

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [complaintId, setComplaintId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser');
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setGpsCoords({ lat, lng });

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const data = await res.json();
          setAddress(data?.display_name || 'Address not available');
        } catch {
          setAddress('Unable to fetch address');
        }
        setGpsLoading(false);
      },
      (err) => {
        setGpsError(err.message || 'Unable to retrieve location');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingCorporations(true);

    fetch('/api/corporations', { headers: authHeaders(), credentials: 'include' })
      .then((res) => safeParseJsonResponse(res))
      .then((payload) => {
        if (cancelled) return;
        if (!payload?.success) throw new Error(payload?.message || 'Failed to load corporations');
        const corps = payload?.data?.corporations || (Array.isArray(payload?.data) ? payload.data : []);
        setCorporations(corps);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Unable to load corporations');
      })
      .finally(() => {
        if (!cancelled) setLoadingCorporations(false);
      });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedCorporation) {
      setWards([]);
      setSelectedWard('');
      return;
    }

    let cancelled = false;
    setLoadingWards(true);
    setSelectedWard('');

    fetch(`/api/wards?corporation=${selectedCorporation}`, { headers: authHeaders(), credentials: 'include' })
      .then((res) => safeParseJsonResponse(res))
      .then((payload) => {
        if (cancelled) return;
        if (!payload?.success) throw new Error(payload?.message || 'Failed to load wards');
        const wardList = payload?.data?.wards || (Array.isArray(payload?.data) ? payload.data : []);
        setWards(wardList);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Unable to load wards');
      })
      .finally(() => {
        if (!cancelled) setLoadingWards(false);
      });

    return () => { cancelled = true; };
  }, [selectedCorporation]);

  const syncFormState = useCallback((patch) => {
    if (typeof onFormStateChange === 'function') {
      onFormStateChange((prev) => ({ ...prev, ...patch }));
    }
  }, [onFormStateChange]);

  const handlePhotoSelect = useCallback(async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setUploadError('Please select valid image files');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('Each image must be under 10MB');
        return;
      }
    }

    setUploadError('');
    setError('');
    setUploading(true);

    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const payload = await safeParseJsonResponse(res).catch(() => ({}));
        if (!res.ok) throw new Error(payload?.message || 'Upload failed');
        return {
          url: payload?.data?.photoUrl || payload?.data?.url || payload?.data?.filePath || '',
          filename: payload?.data?.photoFilename || payload?.data?.filename || '',
          preview: URL.createObjectURL(file),
        };
      });

      const uploaded = await Promise.all(uploadPromises);
      setPhotos((prev) => {
        const next = [...prev, ...uploaded];
        syncFormState({ photos: next });
        return next;
      });
    } catch (err) {
      setUploadError(err?.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
      if (event.target) event.target.value = '';
    }
  }, []);

  const handleRemovePhoto = useCallback((index) => {
    setPhotos((prev) => {
      if (prev[index]?.preview) URL.revokeObjectURL(prev[index].preview);
      const next = prev.filter((_, i) => i !== index);
      syncFormState({ photos: next });
      return next;
    });
  }, []);

  useEffect(() => {
    return () => {
      photos.forEach((p) => { if (p.preview) URL.revokeObjectURL(p.preview); });
    };
  }, []);

  const canGoNext = () => {
    if (step === 1) return photos.length > 0 && !uploading;
    if (step === 2) return selectedCorporation && selectedWard && gpsCoords;
    if (step === 3) return category && !submitting;
    return false;
  };

  const handleNext = () => {
    if (step < 3 && canGoNext()) {
      const next = step + 1;
      setStep(next);
      syncFormState({ step: next });
    }
  };

  const handleBack = () => {
    if (step > 1) {
      const prev = step - 1;
      setStep(prev);
      syncFormState({ step: prev });
    }
  };

  const handleSubmit = async () => {
    if (!photos.length || !category || !selectedCorporation || !selectedWard || !gpsCoords || submitting) return;

    setSubmitting(true);
    setError('');

    try {
      const body = {
        photos: photos.map((p) => ({ url: p.url, filename: p.filename })),
        photoUrl: photos[0]?.url || '',
        photoFilename: photos[0]?.filename || '',
        latitude: gpsCoords.lat,
        longitude: gpsCoords.lng,
        address,
        dateCaptured: dateTime.toISOString(),
        corporationId: selectedCorporation,
        wardId: selectedWard,
        category,
        description: description.trim(),
        reportedBy: user?._id,
      };

      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await safeParseJsonResponse(res).catch(() => ({}));
      if (!res.ok) throw new Error(payload?.message || 'Failed to submit complaint');

      const id = payload?.data?.complaintId || payload?.data?._id || payload?.data?.id || '';
      setComplaintId(id);
      setSubmitted(true);

      if (typeof onComplaintSubmitted === 'function') {
        onComplaintSubmitted(payload?.data);
      }
    } catch (err) {
      setError(err?.message || 'Unable to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="complaint-form">
        <div className="success-card">
          <div className="success-icon">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="32" fill="#d1fae5" />
              <path d="M20 33l8 8 16-16" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2>Complaint Submitted</h2>
          <p className="success-message">Your complaint has been successfully registered.</p>
          {complaintId && <p className="complaint-id">Complaint ID: <strong>{complaintId}</strong></p>}
        </div>

        <style jsx>{`
          .complaint-form { display: flex; justify-content: center; padding: 2rem 1rem; overflow-y: auto; flex: 1; scrollbar-width: thin; scrollbar-color: rgba(148, 163, 184, 0.6) rgba(241, 245, 249, 0.8); }
          .success-card {
            background: #fff;
            border-radius: 1.25rem;
            box-shadow: 0 4px 24px rgba(2, 32, 26, 0.08);
            padding: 3rem 2rem;
            text-align: center;
            max-width: 480px;
            width: 100%;
            display: grid;
            gap: 1rem;
            place-items: center;
          }
          .success-icon { margin-bottom: 0.5rem; }
          h2 { margin: 0; font-size: 1.5rem; color: #02201a; font-weight: 700; }
          .success-message { margin: 0; color: #475569; font-size: 1rem; }
          .complaint-id { margin: 0; color: #059669; font-size: 0.95rem; font-weight: 500; }
          .complaint-id strong { font-weight: 700; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="complaint-form">
      <div className="form-card">
        <h2>Submit Complaint</h2>
        <p className="form-subtitle">Report a waste management issue in your area</p>

        <div className="step-dots">
          {[1, 2, 3].map((s) => (
            <span key={s} className={`dot ${s === step ? 'dot--active' : ''} ${s < step ? 'dot--done' : ''}`} />
          ))}
        </div>

        {error && <p className="global-error">{error}</p>}

        <div className="step-content">
          {step === 1 && (
            <div className="step-inner">
              <h3>Photo Evidence</h3>
              <p className="step-hint">Take photos or upload images of the issue (up to 5)</p>

              <input
                ref={(el) => { el && (el.value = ''); }}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="file-input"
                onChange={handlePhotoSelect}
                disabled={uploading}
              />

              {photos.length > 0 && (
                <div className="photos-grid">
                  {photos.map((photo, idx) => (
                    <div key={idx} className="preview-wrapper">
                      <img src={photo.preview || photo.url} alt={`Evidence ${idx + 1}`} className="preview-image" />
                      <button type="button" className="remove-btn" onClick={() => handleRemovePhoto(idx)}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path d="M6 6l8 8M14 6l-8 8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {photos.length < 5 && (
                <label className="upload-area">
                  <input type="file" accept="image/*" capture="environment" multiple onChange={handlePhotoSelect} disabled={uploading} />
                  <div className="upload-placeholder">
                    {uploading ? (
                      <span className="spinner" />
                    ) : (
                      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                        <rect width="48" height="48" rx="12" fill="#d1fae5" />
                        <path d="M24 16v16M16 24h16" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    )}
                    <span>{uploading ? 'Uploading...' : 'Tap to add more photos'}</span>
                    {photos.length > 0 && <span className="photo-count">{photos.length}/5 added</span>}
                  </div>
                </label>
              )}

              {uploadError && <p className="field-error">{uploadError}</p>}
            </div>
          )}

          {step === 2 && (
            <div className="step-inner">
              <h3>Location &amp; Details</h3>

              <div className="editable-fields">
                <div className="field">
                  <div className="field-header">
                    <span className="field-label">GPS Coordinates</span>
                    <button
                      type="button"
                      className="locate-btn"
                      onClick={() => {
                        if (!navigator.geolocation) return;
                        setGpsLoading(true);
                        setGpsError('');
                        navigator.geolocation.getCurrentPosition(
                          async (position) => {
                            const lat = position.coords.latitude;
                            const lng = position.coords.longitude;
                            setGpsCoords({ lat, lng });
                            syncFormState({ gpsCoords: { lat, lng } });
                            try {
                              const res = await fetch(
                                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
                              );
                              const data = await res.json();
                              const newAddress = data?.display_name || 'Address not available';
                              setAddress(newAddress);
                              syncFormState({ address: newAddress });
                            } catch {
                              setAddress('Unable to fetch address');
                            }
                            setGpsLoading(false);
                          },
                          (err) => {
                            setGpsError(err.message || 'Unable to retrieve location');
                            setGpsLoading(false);
                          },
                          { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
                        );
                      }}
                      disabled={gpsLoading}
                    >
                      {gpsLoading ? 'Locating...' : 'Locate Me'}
                    </button>
                  </div>
                  {gpsError && <p className="field-error">{gpsError}</p>}
                  <div className="gps-inputs">
                    <label className="field">
                      <span className="field-label">Latitude</span>
                      <input
                        type="number"
                        step="any"
                        value={gpsCoords?.lat ?? ''}
                        onChange={(e) => {
                          const lat = parseFloat(e.target.value) || 0;
                          const newCoords = { ...gpsCoords, lat };
                          setGpsCoords(newCoords);
                          syncFormState({ gpsCoords: newCoords });
                        }}
                        placeholder="e.g. 31.585075"
                      />
                    </label>
                    <label className="field">
                      <span className="field-label">Longitude</span>
                      <input
                        type="number"
                        step="any"
                        value={gpsCoords?.lng ?? ''}
                        onChange={(e) => {
                          const lng = parseFloat(e.target.value) || 0;
                          const newCoords = { ...gpsCoords, lng };
                          setGpsCoords(newCoords);
                          syncFormState({ gpsCoords: newCoords });
                        }}
                        placeholder="e.g. 74.311270"
                      />
                    </label>
                  </div>
                </div>

                <label className="field">
                  <span className="field-label">Address</span>
                  <textarea
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      syncFormState({ address: e.target.value });
                    }}
                    placeholder="Enter the address"
                    rows={2}
                  />
                </label>

                <label className="field">
                  <span className="field-label">Date &amp; Time</span>
                  <input
                    type="datetime-local"
                    value={toDateTimeLocalValue(dateTime)}
                    onChange={(e) => {
                      const newDate = new Date(e.target.value);
                      if (!isNaN(newDate.getTime())) {
                        setDateTime(newDate);
                        syncFormState({ dateTime: newDate });
                      }
                    }}
                  />
                </label>
              </div>

              <div className="field-group">
                <label className="field">
                  <span className="field-label">Corporation</span>
                  <select
                    value={selectedCorporation}
                    onChange={(e) => {
                      setSelectedCorporation(e.target.value);
                      syncFormState({ selectedCorporation: e.target.value });
                    }}
                    disabled={loadingCorporations}
                  >
                    <option value="">
                      {loadingCorporations ? 'Loading...' : 'Select corporation'}
                    </option>
                    {corporations.map((corp) => (
                      <option key={corp._id || corp.id} value={corp._id || corp.id}>
                        {corp.name || corp.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span className="field-label">Ward</span>
                  <select
                    value={selectedWard}
                    onChange={(e) => {
                      setSelectedWard(e.target.value);
                      syncFormState({ selectedWard: e.target.value });
                    }}
                    disabled={!selectedCorporation || loadingWards}
                  >
                    <option value="">
                      {loadingWards ? 'Loading...' : !selectedCorporation ? 'Select corporation first' : 'Select ward'}
                    </option>
                    {wards.map((ward) => (
                      <option key={ward._id || ward.id} value={ward._id || ward.id}>
                        {ward.name || ward.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="step-inner">
              <h3>Category &amp; Description</h3>

              <div className="categories">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`category-chip ${category === cat.id ? 'category-chip--active' : ''}`}
                    onClick={() => { setCategory(cat.id); syncFormState({ category: cat.id }); }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="field">
                <div className="field-header">
                  <span className="field-label">Description</span>
                  <span className="char-count">{description.length}/{MAX_DESCRIPTION}</span>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_DESCRIPTION) {
                      setDescription(e.target.value);
                      syncFormState({ description: e.target.value });
                    }
                  }}
                  placeholder="Describe the issue in detail"
                  rows={4}
                />
              </div>
            </div>
          )}
        </div>

        <div className="nav-buttons">
          {step > 1 && (
            <button type="button" className="btn btn-back" onClick={handleBack} disabled={submitting}>
              Back
            </button>
          )}
          <div className="nav-spacer" />
          {step < 3 ? (
            <button
              type="button"
              className="btn btn-next"
              onClick={handleNext}
              disabled={!canGoNext()}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-submit"
              onClick={handleSubmit}
              disabled={!canGoNext()}
            >
              {submitting ? 'Submitting...' : 'Submit Complaint'}
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .complaint-form {
          display: flex;
          justify-content: center;
          padding: 2rem 1rem;
          min-height: 500px;
          overflow-y: auto;
          flex: 1;
          scrollbar-width: thin;
          scrollbar-color: rgba(148, 163, 184, 0.6) rgba(241, 245, 249, 0.8);
        }

        .form-card {
          background: #fff;
          border-radius: 1.25rem;
          box-shadow: 0 4px 24px rgba(2, 32, 26, 0.08);
          padding: 2rem;
          width: 100%;
          max-width: 560px;
          display: grid;
          gap: 1.5rem;
        }

        h2 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
          color: #02201a;
        }

        .form-subtitle {
          margin: -0.5rem 0 0;
          color: #64748b;
          font-size: 0.95rem;
        }

        .step-dots {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #e2e8f0;
          transition: all 0.3s ease;
        }

        .dot--active {
          background: #059669;
          transform: scale(1.2);
          box-shadow: 0 0 0 4px rgba(5, 150, 105, 0.2);
        }

        .dot--done {
          background: #10b981;
        }

        .global-error {
          margin: 0;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #991b1b;
          font-size: 0.9rem;
        }

        .step-content {
          min-height: 240px;
        }

        .step-inner {
          display: grid;
          gap: 1rem;
        }

        .step-inner h3 {
          margin: 0;
          font-size: 1.15rem;
          font-weight: 600;
          color: #02201a;
        }

        .step-hint {
          margin: -0.25rem 0 0;
          color: #64748b;
          font-size: 0.9rem;
        }

        .file-input {
          display: none;
        }

        .upload-area {
          display: flex;
          cursor: pointer;
          border: 2px dashed #d1fae5;
          border-radius: 1rem;
          padding: 2.5rem 1rem;
          transition: all 0.2s ease;
          background: #f0fdf4;
        }

        .upload-area:hover {
          border-color: #059669;
          background: #d1fae5;
        }

        .upload-area input {
          display: none;
        }

        .upload-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          color: #059669;
          font-size: 0.95rem;
          font-weight: 500;
        }

        .photo-count {
          font-size: 0.8rem;
          color: #64748b;
          font-weight: 400;
        }

        .preview-wrapper {
          position: relative;
          border-radius: 1rem;
          overflow: hidden;
          background: #f0fdf4;
        }

        .photos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 0.75rem;
        }

        .photos-grid .preview-wrapper {
          aspect-ratio: 1;
        }

        .preview-image {
          display: block;
          width: 100%;
          max-height: 300px;
          object-fit: contain;
          border-radius: 1rem;
        }

        .preview-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          background: rgba(2, 32, 26, 0.6);
          color: #fff;
          font-weight: 600;
          font-size: 0.95rem;
          border-radius: 1rem;
        }

        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .remove-btn {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: rgba(239, 68, 68, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .remove-btn:hover {
          background: #dc2626;
        }

        .field-error {
          margin: 0;
          color: #991b1b;
          font-size: 0.875rem;
        }

        .info-block {
          display: grid;
          gap: 0.5rem;
          background: #f8fafc;
          border-radius: 0.75rem;
          padding: 1rem 1.25rem;
          border: 1px solid #e2e8f0;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          font-size: 0.9rem;
        }

        .info-label {
          color: #64748b;
          font-weight: 500;
          white-space: nowrap;
        }

        .info-value {
          color: #02201a;
          text-align: right;
          word-break: break-word;
          font-weight: 500;
        }

        .info-error {
          color: #dc2626;
        }

        .editable-fields {
          display: grid;
          gap: 1rem;
        }

        .gps-inputs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        .locate-btn {
          border: none;
          border-radius: 0.5rem;
          padding: 0.35rem 0.75rem;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          background: #f0fdf4;
          color: #059669;
          border: 1.5px solid #d1fae5;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .locate-btn:hover:not(:disabled) {
          background: #d1fae5;
          border-color: #059669;
        }

        .locate-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .field-group {
          display: grid;
          gap: 1rem;
          grid-template-columns: 1fr 1fr;
        }

        .field {
          display: grid;
          gap: 0.35rem;
        }

        .field-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .field-label {
          font-size: 0.9rem;
          font-weight: 600;
          color: #1e293b;
        }

        .char-count {
          font-size: 0.8rem;
          color: #94a3b8;
        }

        input,
        select,
        textarea {
          width: 100%;
          border-radius: 0.75rem;
          border: 2px solid rgba(148, 163, 184, 0.3);
          padding: 0.875rem 1.125rem;
          font-size: 0.95rem;
          background: #ffffff;
          color: #1e293b;
          transition: all 0.3s ease;
          box-sizing: border-box;
          font-family: inherit;
        }

        input:hover:not(:disabled),
        select:hover:not(:disabled),
        textarea:hover:not(:disabled) {
          border-color: rgba(5, 150, 105, 0.4);
        }

        input:focus,
        select:focus,
        textarea:focus {
          outline: none;
          border-color: #059669;
          box-shadow: 0 0 0 4px rgba(5, 150, 105, 0.12);
        }

        input:disabled,
        select:disabled {
          background: #f1f5f9;
          color: #94a3b8;
          cursor: not-allowed;
        }

        textarea {
          resize: vertical;
          min-height: 100px;
        }

        .categories {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .category-chip {
          border: 2px solid #e2e8f0;
          border-radius: 2rem;
          padding: 0.6rem 1.1rem;
          background: #fff;
          color: #475569;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .category-chip:hover {
          border-color: #10b981;
          color: #02201a;
        }

        .category-chip--active {
          background: #059669;
          border-color: #059669;
          color: #fff;
          box-shadow: 0 2px 8px rgba(5, 150, 105, 0.3);
        }

        .category-chip--active:hover {
          background: #047857;
          border-color: #047857;
          color: #fff;
        }

        .nav-buttons {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding-top: 0.5rem;
          border-top: 1px solid #f1f5f9;
        }

        .nav-spacer {
          flex: 1;
        }

        .btn {
          border: none;
          border-radius: 0.75rem;
          padding: 0.75rem 1.5rem;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-back {
          background: #f1f5f9;
          color: #475569;
          border: 1.5px solid rgba(148, 163, 184, 0.3);
        }

        .btn-back:hover:not(:disabled) {
          background: #e2e8f0;
        }

        .btn-next {
          background: linear-gradient(135deg, #059669, #047857);
          color: #fff;
          box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
        }

        .btn-next:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(5, 150, 105, 0.4);
        }

        .btn-submit {
          background: linear-gradient(135deg, #02201a, #059669);
          color: #fff;
          box-shadow: 0 4px 12px rgba(2, 32, 26, 0.3);
        }

        .btn-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(2, 32, 26, 0.4);
        }

        @media (max-width: 640px) {
          .complaint-form {
            padding: 1rem 0.5rem;
          }

          .form-card {
            padding: 1.25rem;
            border-radius: 1rem;
          }

          h2 {
            font-size: 1.25rem;
          }

          .field-group {
            grid-template-columns: 1fr;
          }

          .info-row {
            flex-direction: column;
            gap: 0.15rem;
          }

          .info-value {
            text-align: left;
          }

          .category-chip {
            font-size: 0.85rem;
            padding: 0.5rem 0.9rem;
          }

          .btn {
            padding: 0.65rem 1.2rem;
            font-size: 0.9rem;
          }

          .upload-area {
            padding: 2rem 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}

function formatDateTime(date) {
  if (!date) return '';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

function toDateTimeLocalValue(date) {
  if (!date) return '';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
}
