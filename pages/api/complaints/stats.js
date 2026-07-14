import { getDashboardStats } from '../../../controllers/complaintController';
import authMiddleware from '../../../middlewares/authMiddleware';
import roleMiddleware from '../../../middlewares/roleMiddleware';
import { jsonError } from '../../../lib/response';
import { applyCors } from '../../../utils';

export default async function handler(req, res) {
  if (await applyCors(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return jsonError(res, 405, `Method ${req.method} not allowed`);
  }
  const user = await authMiddleware(req, res);
  if (!user) return;
  if (!roleMiddleware(['admin', 'superadmin', 'developer'])(req, res)) return;
  return getDashboardStats(req, res);
}
