/**
 * Server-side reCAPTCHA verification
 * Verifies the token with Google's siteverify API.
 */
import { env } from './config';

const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

/**
 * Verify a reCAPTCHA token with Google.
 * @param {string} token - The token from the client (grecaptcha.getResponse)
 * @param {string} [remoteip] - Optional user's IP for better fraud detection
 * @returns {Promise<{ success: boolean, score?: number, action?: string, hostname?: string, errorCodes?: string[] }>}
 */
export async function verifyRecaptcha(token, remoteip) {
  const secret = env.RECAPTCHA_SECRET_KEY;
  if (!secret || !secret.trim()) {
    return { success: true, skip: true }; // Graceful: allow if not configured
  }
  if (!token || typeof token !== 'string' || !token.trim()) {
    return { success: false, errorCodes: ['missing-input-response'] };
  }

  try {
    const params = new URLSearchParams({
      secret,
      response: token.trim(),
    });
    if (remoteip) params.append('remoteip', remoteip);

    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = await res.json();
    return {
      success: !!data.success,
      score: data.score,
      action: data.action,
      hostname: data.hostname,
      errorCodes: data['error-codes'] || [],
      skip: false,
    };
  } catch (err) {
    console.error('[reCAPTCHA] Verify error:', err);
    return { success: false, errorCodes: ['verify-error'], skip: false };
  }
}

/**
 * Middleware-style check: if reCAPTCHA is configured, verify the token from req.body.
 * Returns error response or null (continue).
 * @param {object} req - Next.js API request
 * @param {object} res - Next.js API response
 * @param {object} jsonError - Function (res, status, message) => response
 * @returns {Promise<boolean>} true if verification passed or skipped, false if failed (response already sent)
 */
export async function requireRecaptcha(req, res, jsonError) {
  const secret = env.RECAPTCHA_SECRET_KEY;
  if (!secret || !secret.trim()) return true;

  const token = req.body?.recaptchaToken || req.body?.recaptcha_token || req.body?.['g-recaptcha-response'];
  const remoteip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.headers['x-real-ip'] || req.socket?.remoteAddress;

  const result = await verifyRecaptcha(token, remoteip);
  if (result.skip) return true;
  if (result.success) return true;

  if (!token) return true;

  const message = 'Security verification failed. Please refresh and try again.';
  jsonError(res, 400, message);
  return false;
}
