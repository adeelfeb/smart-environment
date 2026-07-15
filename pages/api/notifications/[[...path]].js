import { getNotifications, markAsRead, getUnreadCount } from '../../../controllers/notificationController';
import authMiddleware from '../../../middlewares/authMiddleware';
import { jsonError } from '../../../lib/response';
import { applyCors } from '../../../utils';

export default async function handler(req, res) {
  if (await applyCors(req, res)) return;
  const { method } = req;
  const { path } = req.query;
  const segments = Array.isArray(path) ? path : path ? [path] : [];

  switch (method) {
    case 'GET': {
      const user = await authMiddleware(req, res);
      if (!user) return;

      if (segments[0] === 'unread-count') {
        return getUnreadCount(req, res);
      }
      return getNotifications(req, res);
    }
    case 'PUT': {
      const user = await authMiddleware(req, res);
      if (!user) return;

      if (segments[0] === 'read') {
        return markAsRead(req, res);
      }
      return jsonError(res, 404, 'Not found');
    }
    default: {
      res.setHeader('Allow', ['GET', 'PUT']);
      return jsonError(res, 405, `Method ${method} not allowed`);
    }
  }
}
