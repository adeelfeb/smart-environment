import { signup } from '../../../controllers/authController';
import { jsonError } from '../../../lib/response';
import { applyCors } from '../../../utils';
import { env } from '../../../lib/config';

export default async function handler(req, res) {
  try {
    if (await applyCors(req, res)) return;

    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return jsonError(res, 405, `Method ${req.method} not allowed`);
    }

    if (!env.MONGODB_URI) {
      return jsonError(res, 503, 'Database configuration is missing. Please contact support.', null, 'NO_DB_URI');
    }
    if (!env.JWT_SECRET) {
      return jsonError(res, 503, 'Authentication service is currently unavailable. Please try again later.', null, 'NO_JWT_SECRET');
    }

    return signup(req, res);
  } catch (err) {
    console.error('[Signup API] Unhandled error:', err);
    if (!res.headersSent) {
      const message = err.message
        ? `Sign-up failed: ${err.message}`
        : 'Unable to create your account at this time. Please try again later.';
      return jsonError(res, 500, message, null, 'UNHANDLED_ERROR');
    }
  }
}

