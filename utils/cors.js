// Lightweight CORS middleware for Next.js API routes
// Returns true if the request has been handled (e.g., OPTIONS), otherwise false
import connectDB from '../lib/db';
import { env } from '../lib/config';
import AllowedOrigin from '../models/AllowedOrigin';

const DEFAULT_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
const DEFAULT_HEADERS = ['Content-Type', 'Authorization'];
const DEFAULT_MAX_AGE = 60 * 60 * 24; // 24 hours
const CORS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let cachedOrigins = {
  normalized: new Set(),
  raw: [],
  expiresAt: 0,
};

function parseDefaultOrigins() {
  // Default origins that should always be allowed
  const defaultOrigins = [
    'https://googleweb.uk',
    'http://googleweb.uk',
    'https://global-node.thefvg.com',
    'https://designndev.com',
    'http://designndev.com',
  ];
  
  const configured = env.CORS_DEFAULT_ORIGINS || '';
  if (configured) {
    const envOrigins = configured
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => AllowedOrigin.normalizeOrigin?.(value) || '')
      .filter(Boolean);
    defaultOrigins.push(...envOrigins);
  }
  
  return defaultOrigins
    .map((value) => AllowedOrigin.normalizeOrigin?.(value) || '')
    .filter(Boolean);
}

async function loadAllowedOrigins() {
  const now = Date.now();
  if (cachedOrigins.expiresAt > now && cachedOrigins.raw.length) {
    return cachedOrigins;
  }

  const defaults = parseDefaultOrigins();

  try {
    const dbResult = await connectDB();
    if (!dbResult.success) {
      const normalized = new Set(defaults);
      cachedOrigins = {
        normalized,
        raw: defaults,
        expiresAt: now + CORS_CACHE_TTL_MS / 2,
      };
      return cachedOrigins;
    }
    const records = await AllowedOrigin.find({ isActive: true })
      .select('origin normalizedOrigin')
      .lean()
      .exec();
    const normalized = new Set(records.map((record) => record.normalizedOrigin));
    defaults.forEach((origin) => normalized.add(origin));
    const raw = Array.from(normalized);

    cachedOrigins = {
      normalized,
      raw,
      expiresAt: now + CORS_CACHE_TTL_MS,
    };
    return cachedOrigins;
  } catch (error) {
    const normalized = new Set(defaults);
    cachedOrigins = {
      normalized,
      raw: defaults,
      expiresAt: now + CORS_CACHE_TTL_MS / 2,
    };
    return cachedOrigins;
  }
}

export function clearCorsCache() {
  cachedOrigins = {
    normalized: new Set(),
    raw: [],
    expiresAt: 0,
  };
}

function getRequestHost(req) {
  // Get the host from the request
  const host = req.headers.host || req.headers['x-forwarded-host'] || '';
  const protocol = req.headers['x-forwarded-proto'] || 
                   (req.connection?.encrypted ? 'https' : 'http') || 
                   'http';
  
  if (!host) return null;
  
  try {
    // Construct origin from host
    return `${protocol}://${host}`;
  } catch {
    return null;
  }
}

export async function applyCors(req, res, options = {}) {
  const {
    methods = DEFAULT_METHODS,
    headers = DEFAULT_HEADERS,
    allowCredentials = true,
    maxAge = DEFAULT_MAX_AGE,
    defaultOrigin = '',
    allowWhenNoOrigin = true,
    allowSameOrigin = true, // Allow same-origin requests by default
  } = options;

  const { normalized } = await loadAllowedOrigins();

  const requestOrigin = req.headers.origin;
  const requestHost = getRequestHost(req);
  let resolvedOrigin = '';

  // Normalize both origin and host for comparison
  const normalizedRequestOrigin = requestOrigin ? AllowedOrigin.normalizeOrigin?.(requestOrigin) || '' : '';
  const normalizedRequestHost = requestHost ? AllowedOrigin.normalizeOrigin?.(requestHost) || '' : '';

  // Check if this is a same-origin request (origin matches host)
  const isSameOrigin = normalizedRequestOrigin && normalizedRequestHost && 
    normalizedRequestOrigin === normalizedRequestHost;

  if (requestOrigin) {
    // If same-origin request, always allow
    if (allowSameOrigin && isSameOrigin) {
      resolvedOrigin = requestOrigin;
    } 
    // Check if origin is in allowed list (database or defaults)
    else if (normalizedRequestOrigin && normalized.has(normalizedRequestOrigin)) {
      resolvedOrigin = requestOrigin;
    } 
    // Reject if not allowed
    else {
      res.status(403).json({
        success: false,
        message: 'Origin not allowed',
        details: `Origin "${requestOrigin}" is not in the allowed origins list`,
      });
      return true;
    }
  } 
  // If no origin header - this is a same-origin request (browser) or server-side request
  // Always allow these requests
  else {
    // For same-origin requests, we can set the origin to the request host
    // This helps with CORS headers if needed
    if (allowSameOrigin && requestHost) {
      resolvedOrigin = requestHost;
    } else if (defaultOrigin) {
      resolvedOrigin = defaultOrigin;
    }
    // If no origin to set, the request will proceed without CORS headers
    // This is fine for same-origin requests
  }

  if (resolvedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', resolvedOrigin);
  }
  res.setHeader('Vary', 'Origin');

  res.setHeader('Access-Control-Allow-Methods', methods.join(', '));
  res.setHeader('Access-Control-Allow-Headers', headers.join(', '));
  res.setHeader('Access-Control-Max-Age', String(maxAge));

  if (allowCredentials && resolvedOrigin && resolvedOrigin !== '*') {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }

  return false;
}

