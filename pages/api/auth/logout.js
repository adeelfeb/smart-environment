import { logout } from '../../../controllers/authController';
import { jsonError, jsonSuccess } from '../../../lib/response';
import { applyCors } from '../../../utils';

export default async function handler(req, res) {
  try {
    if (await applyCors(req, res)) return;

    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return jsonError(res, 405, `Method ${req.method} not allowed`);
    }
    return logout(req, res);
  } catch (err) {
    console.error('[Logout API] Unhandled error:', err);
    if (!res.headersSent) {
      return jsonSuccess(res, 200, 'Logged out');
    }
  }
}

