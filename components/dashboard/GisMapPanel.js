'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { safeParseJsonResponse } from '../../utils/safeJsonResponse';

const STATUS_CONFIG = {
  Pending: { color: '#f59e0b', label: 'Pending' },
  'Under Review': { color: '#3b82f6', label: 'Under Review' },
  'Work in Progress': { color: '#f97316', label: 'Work in Progress' },
  Resolved: { color: '#10b981', label: 'Resolved' },
  Rejected: { color: '#ef4444', label: 'Rejected' },
};

const DEFAULT_CENTER = [30.3753, 69.3451];
const DEFAULT_ZOOM = 6;

function createIcon(color) {
  if (typeof window === 'undefined' || !window.L) return null;
  return window.L.divIcon({
    className: 'gis-map-marker',
    html: `<div style="
      width: 24px; height: 24px;
      border-radius: 50% 50% 50% 0;
      background: ${color};
      transform: rotate(-45deg);
      border: 2px solid #fff;
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
    "><div style="
      width: 8px; height: 8px;
      background: #fff;
      border-radius: 50%;
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%,-50%);
    "></div></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
}

export default function GisMapPanel({ user, onSelectComplaint }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilters, setActiveFilters] = useState(
    Object.keys(STATUS_CONFIG).reduce((acc, key) => ({ ...acc, [key]: true }), {})
  );
  const [leafletReady, setLeafletReady] = useState(false);

  useEffect(() => {
    if (window.L) {
      setLeafletReady(true);
      return;
    }

    const existingCSS = document.querySelector('link[href*="leaflet/1.9.4/dist/leaflet.css"]') ||
      document.querySelector('link[href*="unpkg.com/leaflet"]');
    if (!existingCSS) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }

    const existingJS = document.querySelector('script[src*="leaflet/1.9.4/dist/leaflet.js"]') ||
      document.querySelector('script[src*="unpkg.com/leaflet"]');
    if (existingJS) {
      if (window.L) {
        setLeafletReady(true);
      } else {
        existingJS.addEventListener('load', () => setLeafletReady(true));
        existingJS.addEventListener('error', () => {});
      }
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.crossOrigin = '';
    script.onload = () => setLeafletReady(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!leafletReady || !mapRef.current || mapInstanceRef.current || !window.L) return;

    const map = window.L.map(mapRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
      attributionControl: true,
    });

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [leafletReady]);

  const fetchMapData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch('/api/complaints/map-data', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      const data = await safeParseJsonResponse(res);
      if (data.success && data.data) {
        setComplaints(data.data.complaints || []);
      } else {
        setError(data.message || 'Failed to load map data');
      }
    } catch {
      setError('Unable to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMapData();
  }, [fetchMapData]);

  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const map = mapInstanceRef.current;
    const L = window.L;

    const filtered = complaints.filter(
      (c) => c.location?.latitude && c.location?.longitude && activeFilters[c.status]
    );

    const bounds = [];

    filtered.forEach((c) => {
      const lat = parseFloat(c.location.latitude);
      const lng = parseFloat(c.location.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const statusCfg = STATUS_CONFIG[c.status] || { color: '#64748b' };
      const icon = createIcon(statusCfg.color);

      const popupHtml = `
        <div style="font-family:inherit;min-width:180px;line-height:1.5;">
          <div style="font-weight:600;margin-bottom:4px;color:#1e293b;">
            #${c.complaintId || c.id || 'N/A'}
          </div>
          <div style="font-size:13px;color:#475569;">
            <div><strong>Category:</strong> ${c.category || '—'}</div>
            <div><strong>Status:</strong> <span style="color:${statusCfg.color};font-weight:600;">${c.status || '—'}</span></div>
            <div><strong>Address:</strong> ${c.location?.address || '—'}</div>
            <div><strong>Date:</strong> ${c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}</div>
          </div>
        </div>
      `;

      const marker = L.marker([lat, lng], { icon })
        .bindPopup(popupHtml, { maxWidth: 300 })
        .addTo(map);

      marker.on('click', () => {
        if (onSelectComplaint) {
          onSelectComplaint(c);
        }
      });

      markersRef.current.push(marker);
      bounds.push([lat, lng]);
    });

    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 12);
    }
  }, [complaints, activeFilters, onSelectComplaint]);

  const toggleFilter = (status) => {
    setActiveFilters((prev) => ({ ...prev, [status]: !prev[status] }));
  };

  const activeCount = complaints.filter(
    (c) => c.location?.latitude && c.location?.longitude && activeFilters[c.status]
  ).length;

  return (
    <div className="gis-panel">
      {loading && !mapInstanceRef.current && (
        <div className="gis-panel-loading">
          <div className="gis-panel-spinner" />
          <span>Loading map…</span>
        </div>
      )}

      {error && <div className="gis-panel-error">{error}</div>}

      <div ref={mapRef} className="gis-panel-map" />

      <div className="gis-panel-filters">
        <div className="gis-panel-filters-header">
          <span className="gis-panel-filters-title">Filter by Status</span>
          <span className="gis-panel-filters-count">{activeCount} shown</span>
        </div>
        {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
          <label key={status} className="gis-panel-filter-item">
            <input
              type="checkbox"
              checked={activeFilters[status]}
              onChange={() => toggleFilter(status)}
            />
            <span className="gis-panel-filter-dot" style={{ background: cfg.color }} />
            <span className="gis-panel-filter-label">{cfg.label}</span>
          </label>
        ))}
      </div>

      <div className="gis-panel-legend">
        <div className="gis-panel-legend-title">Legend</div>
        {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
          <div key={status} className="gis-panel-legend-item">
            <span className="gis-panel-legend-dot" style={{ background: cfg.color }} />
            <span>{cfg.label}</span>
          </div>
        ))}
      </div>

      <style jsx>{`
        .gis-panel {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 500px;
          display: flex;
          flex-direction: column;
          font-family: inherit;
        }

        .gis-panel-map {
          width: 100%;
          height: 100%;
          min-height: 500px;
          z-index: 0;
        }

        .gis-panel-loading {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: rgba(255, 255, 255, 0.85);
          z-index: 1000;
          font-size: 14px;
          color: #475569;
        }

        .gis-panel-spinner {
          width: 24px;
          height: 24px;
          border: 3px solid #e2e8f0;
          border-top-color: #10b981;
          border-radius: 50%;
          animation: gis-spin 0.8s linear infinite;
        }

        @keyframes gis-spin {
          to { transform: rotate(360deg); }
        }

        .gis-panel-error {
          position: absolute;
          top: 12px;
          left: 50%;
          transform: translateX(-50%);
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 10px 20px;
          font-size: 13px;
          z-index: 1001;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .gis-panel-filters {
          position: absolute;
          top: 12px;
          left: 12px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 10px;
          padding: 14px 16px;
          z-index: 1000;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
          min-width: 180px;
          backdrop-filter: blur(4px);
        }

        .gis-panel-filters-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e2e8f0;
        }

        .gis-panel-filters-title {
          font-weight: 600;
          font-size: 13px;
          color: #1e293b;
        }

        .gis-panel-filters-count {
          font-size: 11px;
          color: #64748b;
          background: #f1f5f9;
          padding: 2px 8px;
          border-radius: 10px;
        }

        .gis-panel-filter-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 5px 0;
          cursor: pointer;
          font-size: 13px;
          color: #334155;
          user-select: none;
        }

        .gis-panel-filter-item input[type="checkbox"] {
          width: 14px;
          height: 14px;
          cursor: pointer;
          accent-color: #10b981;
        }

        .gis-panel-filter-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .gis-panel-filter-label {
          line-height: 1.2;
        }

        .gis-panel-legend {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 10px;
          padding: 14px 16px;
          z-index: 1000;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
          min-width: 150px;
          backdrop-filter: blur(4px);
        }

        .gis-panel-legend-title {
          font-weight: 600;
          font-size: 13px;
          color: #1e293b;
          margin-bottom: 10px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e2e8f0;
        }

        .gis-panel-legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 0;
          font-size: 13px;
          color: #334155;
        }

        .gis-panel-legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}
