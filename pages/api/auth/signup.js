import { signup } from '../../../controllers/authController';
import { jsonError } from '../../../lib/response';
import { applyCors } from '../../../utils';

export default async function handler(req, res) {
  try {
    if (await applyCors(req, res)) return;

    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return jsonError(res, 405, `Method ${req.method} not allowed`);
    }
    return signup(req, res);
  } catch (err) {
    console.error('[Signup API] Unhandled error:', err);
    if (!res.headersSent) {
      return jsonError(res, 500, 'Unable to create your account at this time. Please try again later.');
    }
  }
}

