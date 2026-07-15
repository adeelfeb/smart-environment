/**
 * Unified JSON response helpers for API routes.
 * Ensures consistent structure and content-type across all responses.
 */
const isProduction = process.env.NODE_ENV === 'production';

export function jsonSuccess(res, status, message, data) {
  res.setHeader('Content-Type', 'application/json');
  const payload = { success: true, message };
  if (typeof data !== 'undefined') {
    payload.data = data;
  }
  return res.status(status).json(payload);
}

export function jsonError(res, status, message, details, code) {
  res.setHeader('Content-Type', 'application/json');
  const payload = { success: false, message };
  if (code) payload.code = code;
  if (typeof details !== 'undefined' && !isProduction) {
    payload.error = details;
  }
  return res.status(status).json(payload);
}


