import { verifyEmail } from '../../../controllers/authController';
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

    return verifyEmail(req, res);
  } catch (err) {
    console.error('[VerifyEmail API] Unhandled error:', err);
    if (!res.headersSent) {
      return jsonError(res, 500, 'Unable to verify your email at this time.', null, 'UNHANDLED_ERROR');
    }
  }
}

