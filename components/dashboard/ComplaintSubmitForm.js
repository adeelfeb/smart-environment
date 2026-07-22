'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { safeParseJsonResponse } from '../../utils/safeJsonResponse';

const CATEGORIES = [
  { id: 'Overflowing Dustbin', label: 'Overflowing Dustbin' },
  { id: 'Unauthorized Garbage Dumping', label: 'Unauthorized Garbage Dumping' },
  { id: 'Damaged Dustbin', label: 'Damaged Dustbin' },
  { id: 'Missing Dustbin', label: 'Missing Dustbin' },
];

const MAX_DESCRIPTION = 500;

const GPS_ERROR_MESSAGES = {
  1: 'Location access was denied. Please enable location permissions in your browser settings and try again.',
  2: 'Unable to determine your location. The GPS signal may be weak. You can enter coordinates manually.',
  3: 'Location request timed out. Please try again or enter coordinates manually.',
};

function getGpsErrorMessage(err) {
  const code = err && (err.code !== undefined ? err.code : err.PERMISSION_DENIED);
  return GPS_ERROR_MESSAGES[code] || err?.message || 'Unable to retrieve your location';
}

function requestLocation(successCallback, errorCallback) {
  if (!navigator.geolocation) {
    errorCallback({ message: 'Geolocation is not supported by your browser', code: 2 });
    return;
  }

  if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    errorCallback({ message: 'Geolocation requires a secure connection (HTTPS). Location access is not available on HTTP.', code: 1 });
    return;
  }

  let attempts = 0;
  const maxAttempts = 2;

  function attempt() {
    attempts++;
    navigator.geolocation.getCurrentPosition(
      (position) => successCallback(position),
      (err) => {
        if (attempts < maxAttempts && err.code === 3) {
          attempt();
        } else {
          errorCallback(err);
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 120000 }
    );
  }

  attempt();
}

function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function ComplaintSubmitForm({ user, onComplaintSubmitted, formState, onFormStateChange }) {
  const [step, setStep] = useState(() => formState?.step || 1);

  const [photos, setPhotos] = useState(() => formState?.photos || []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const [gpsCoords, setGpsCoords] = useState(() => formState?.gpsCoords || null);
  const [address, setAddress] = useState(() => formState?.address || '');
  const [gpsLoading, setGpsLoading] = useState(true);
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

  const retryLocation = useCallback(() => {
    setGpsLoading(true);
    setGpsError('');

    requestLocation(
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
        setGpsError(getGpsErrorMessage(err));
        setGpsLoading(false);
      }
    );
  }, []);

  useEffect(() => {
    retryLocation();
  }, [retryLocation]);

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
      if (file.size > 20 * 1024 * 1024) {
        setUploadError('Each image must be under 20MB');
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
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include',
          ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
        });
        const payload = await safeParseJsonResponse(res).catch(() => ({}));
        if (!res.ok) throw new Error(payload?.message || 'Upload failed');
        return {
          url: payload?.data?.photoUrl || payload?.data?.url || payload?.data?.filePath || '',
          filename: payload?.data?.photoFilename || payload?.data?.filename || '',
          preview: URL.createObjectURL(file),
        };
      });

      const uploaded = await Promise.all(uploadPromises);
      const updated = [...photos, ...uploaded];
      setPhotos(updated);
      syncFormState({ photos: updated });
    } catch (err) {
      setUploadError(err?.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
      if (event.target) event.target.value = '';
    }
  }, [photos, syncFormState]);

  const handleRemovePhoto = useCallback((index) => {
    const updated = photos.filter((_, i) => i !== index);
    if (photos[index]?.preview) URL.revokeObjectURL(photos[index].preview);
    setPhotos(updated);
    syncFormState({ photos: updated });
  }, [photos, syncFormState]);

  const photosRef = useRef(photos);
  photosRef.current = photos;

  useEffect(() => {
    return () => {
      photosRef.current.forEach((p) => { if (p.preview) URL.revokeObjectURL(p.preview); });
    };
  }, []);

  const canGoNext = () => {
    if (step === 1) return photos.length > 0 && !uploading;
    if (step === 2) return selectedCorporation && selectedWard && gpsCoords && !gpsLoading;
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
        headers: { 'Content-Type': 'application/json', ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {}) },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const payload = await safeParseJsonResponse(res).catch(() => ({}));
      if (!res.ok) throw new Error(payload?.message || 'Failed to submit complaint');

      const id = payload?.data?.complaint?.complaintId || payload?.data?.complaint?._id || payload?.data?.complaint?.id || payload?.data?.complaintId || payload?.data?._id || payload?.data?.id || '';
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
        <div className="success-receipt">
          <div className="success-receipt-inner">
            <div className="success-receipt-header">
              <div className="success-icon">
                <svg width="56" height="56" viewBox="0 0 64 64" fill="none">
                  <circle cx="32" cy="32" r="32" fill="#d1fae5" />
                  <path d="M20 33l8 8 16-16" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="success-receipt-title">Complaint Submitted</h2>
              <p className="success-receipt-msg">Your complaint has been successfully registered.</p>
            </div>

            <div className="success-receipt-divider" />

            {complaintId && (
              <div className="success-receipt-body">
                <div className="success-receipt-label">Complaint ID</div>
                <div className="success-receipt-value">{complaintId}</div>
              </div>
            )}

            <div className="success-receipt-divider success-receipt-divider--dashed" />

            <div className="success-receipt-footer">
              <div className="success-receipt-footer-row">
                <span>Date</span>
                <span>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              <div className="success-receipt-footer-row">
                <span>Status</span>
                <span className="success-receipt-status-chip">Pending</span>
              </div>
            </div>

            <div className="success-receipt-stamp">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="18" stroke="#059669" strokeWidth="2" opacity="0.4" />
                <path d="M13 20l5 5 9-9" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
              </svg>
            </div>
          </div>
        </div>

        <style jsx>{`
          .complaint-form { display: flex; flex-direction: column; align-items: center; padding: 2rem 1rem; flex: 1; }
          .success-receipt {
            background: #fff;
            border-radius: 1.25rem;
            box-shadow: 0 4px 24px rgba(2, 32, 26, 0.08);
            padding: 0;
            max-width: 420px;
            width: 100%;
            border: 1.5px solid #d1fae5;
            position: relative;
            overflow: hidden;
          }
          .success-receipt-inner {
            display: flex;
            flex-direction: column;
            position: relative;
          }
          .success-receipt-header {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.65rem;
            padding: 1.75rem 1.5rem 1rem;
            text-align: center;
          }
          .success-icon { display: flex; justify-content: center; }
          .success-receipt-title { margin: 0; font-size: 1.35rem; color: #02201a; font-weight: 700; }
          .success-receipt-msg { margin: 0; color: #475569; font-size: 0.88rem; }
          .success-receipt-divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.2), transparent);
            margin: 0 1.5rem;
          }
          .success-receipt-divider--dashed {
            height: 0;
            border-top: 1px dashed rgba(16, 185, 129, 0.3);
            background: none;
            margin: 0.5rem 1.5rem;
          }
          .success-receipt-body {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.25rem;
            padding: 0.75rem 1.5rem;
          }
          .success-receipt-label {
            font-size: 0.65rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #94a3b8;
          }
          .success-receipt-value {
            font-size: 1.1rem;
            font-weight: 700;
            color: #02201a;
            font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
            letter-spacing: 0.03em;
          }
          .success-receipt-footer {
            display: flex;
            flex-direction: column;
            gap: 0.4rem;
            padding: 0.25rem 1.5rem 1.5rem;
          }
          .success-receipt-footer-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.78rem;
            color: #64748b;
          }
          .success-receipt-status-chip {
            display: inline-flex;
            padding: 0.15rem 0.6rem;
            border-radius: 999px;
            font-size: 0.68rem;
            font-weight: 600;
            background: #fef3c7;
            color: #92400e;
            border: 1px solid #fbbf24;
          }
          .success-receipt-stamp {
            position: absolute;
            top: 1.25rem;
            right: 1.25rem;
            opacity: 0.8;
            transform: rotate(-12deg);
          }
          @media (max-width: 640px) {
            .success-receipt { border-radius: 1rem; }
            .success-receipt-header { padding: 1.25rem 1rem 0.75rem; }
            .success-receipt-body { padding: 0.5rem 1rem; }
            .success-receipt-footer { padding: 0.25rem 1rem 1.25rem; }
            .success-receipt-divider { margin: 0 1rem; }
            .success-receipt-divider--dashed { margin: 0.4rem 1rem; }
          }
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
              <p className="step-hint">Take a photo with your camera or upload from your device (up to 5)</p>

              {gpsLoading && (
                <div className="gps-status">
                  <span className="spinner-sm" />
                  <span>Detecting your location...</span>
                </div>
              )}
              {gpsError && !gpsLoading && (
                <div className="gps-status gps-status--error">
                  <span className="gps-error-text">{gpsError}</span>
                  <button type="button" className="gps-retry-btn" onClick={retryLocation}>
                    Retry
                  </button>
                </div>
              )}
              {gpsCoords && !gpsLoading && (
                <div className="gps-status gps-status--ok">
                  <span>Location detected</span>
                </div>
              )}

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
                <div className="photo-actions">
                  <div className="photo-actions-label">Add Photo</div>
                  <div className="photo-buttons">
                    <label className="photo-btn photo-btn--camera">
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handlePhotoSelect}
                        disabled={uploading}
                      />
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                      <span>Take Photo</span>
                    </label>
                    <label className="photo-btn photo-btn--upload">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoSelect}
                        disabled={uploading}
                      />
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <span>Upload Photo</span>
                    </label>
                  </div>
                  <p className="photo-actions-hint">You can add up to 5 photos</p>
                </div>
              )}

              {uploading && (
                <div className="uploading-indicator">
                  <span className="spinner" />
                  <span>Uploading photo...</span>
                </div>
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
                        setGpsLoading(true);
                        setGpsError('');
                        requestLocation(
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
                            setGpsError(getGpsErrorMessage(err));
                            setGpsLoading(false);
                          }
                        );
                      }}
                      disabled={gpsLoading}
                    >
                      {gpsLoading ? 'Locating...' : 'Locate Me'}
                    </button>
                  </div>
                  {gpsError && (
                    <div className="field-error-row">
                      <p className="field-error">{gpsError}</p>
                      <button type="button" className="gps-retry-btn" onClick={retryLocation}>Retry</button>
                    </div>
                  )}
                  <div className="gps-inputs">
                    <label className="field">
                      <span className="field-label">Latitude</span>
                      <input
                        type="number"
                        step="any"
                        value={gpsCoords?.lat ?? ''}
                        onChange={(e) => {
                          const lat = parseFloat(e.target.value) || 0;
                          const newCoords = { ...(gpsCoords || { lng: 0 }), lat };
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
                          const newCoords = { ...(gpsCoords || { lat: 0 }), lng };
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
          flex-direction: column;
          align-items: center;
          padding: 2rem 1rem;
          flex: 1;
        }

        .form-card {
          background: #fff;
          border-radius: 1.25rem;
          box-shadow: 0 4px 24px rgba(2, 32, 26, 0.08);
          padding: 2rem;
          width: 100%;
          max-width: 560px;
          display: flex;
          flex-direction: column;
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
          flex: 1;
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

        .gps-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          font-size: 0.8rem;
          font-weight: 500;
          background: #f0fdf4;
          color: #059669;
          border: 1px solid #d1fae5;
        }

        .gps-status--error {
          background: #fef2f2;
          color: #991b1b;
          border-color: #fecaca;
        }

        .gps-error-text {
          flex: 1;
          font-size: 0.78rem;
          line-height: 1.3;
        }

        .gps-retry-btn {
          flex-shrink: 0;
          border: none;
          background: #991b1b;
          color: #fff;
          border-radius: 0.35rem;
          padding: 0.25rem 0.6rem;
          font-size: 0.72rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
          font-family: inherit;
        }

        .gps-retry-btn:hover {
          background: #7f1d1d;
        }

        .gps-status--ok {
          background: #f0fdf4;
          color: #059669;
          border-color: #d1fae5;
        }

        .spinner-sm {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(5, 150, 105, 0.2);
          border-top-color: #059669;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          flex-shrink: 0;
        }

        .photo-actions {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .photo-actions-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: #1e293b;
        }

        .photo-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        .photo-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1.5rem 1rem;
          border-radius: 1rem;
          border: 2px dashed #d1fae5;
          background: #f0fdf4;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #059669;
          font-weight: 600;
          font-size: 0.9rem;
          text-align: center;
        }

        .photo-btn:hover {
          border-color: #059669;
          background: #d1fae5;
        }

        .photo-btn input {
          display: none;
        }

        .photo-btn--camera {
          border-style: solid;
          border-color: #a7f3d0;
        }

        .photo-actions-hint {
          margin: 0;
          font-size: 0.75rem;
          color: #94a3b8;
          text-align: center;
        }

        .uploading-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem;
          color: #059669;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .photo-buttons .spinner {
          border-color: rgba(5, 150, 105, 0.2);
          border-top-color: #059669;
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

        .field-error-row {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
        }

        .field-error-row .field-error {
          flex: 1;
        }

        .field-error-row .gps-retry-btn {
          margin-top: 0;
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
            padding: 0.5rem;
            flex: none;
          }

          .form-card {
            padding: 1rem;
            gap: 1rem;
            box-shadow: none;
            border: 1px solid rgba(16, 185, 129, 0.15);
            background: #ffffff;
          }

          h2 {
            font-size: 1.25rem;
          }

          .step-content {
            flex: none;
            min-height: auto;
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
