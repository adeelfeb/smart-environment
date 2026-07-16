import { resendOTP } from '../../../controllers/authController';
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

    return resendOTP(req, res);
  } catch (err) {
    console.error('[ResendOTP API] Unhandled error:', err);
    if (!res.headersSent) {
      return jsonError(res, 500, 'Unable to resend verification code at this time.', null, 'UNHANDLED_ERROR');
    }
  }
}

