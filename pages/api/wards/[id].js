import { getWardById, updateWard, deleteWard } from '../../../controllers/wardController';
import authMiddleware from '../../../middlewares/authMiddleware';
import roleMiddleware from '../../../middlewares/roleMiddleware';
import { jsonError } from '../../../lib/response';
import { applyCors } from '../../../utils';

export default async function handler(req, res) {
  if (await applyCors(req, res)) return;
  const { method } = req;

  switch (method) {
    case 'GET': {
      const user = await authMiddleware(req, res);
      if (!user) return;
      return getWardById(req, res);
    }
    case 'PUT': {
      const user = await authMiddleware(req, res);
      if (!user) return;
      if (!roleMiddleware(['superadmin', 'developer'])(req, res)) return;
      return updateWard(req, res);
    }
    case 'DELETE': {
      const user = await authMiddleware(req, res);
      if (!user) return;
      if (!roleMiddleware(['superadmin', 'developer'])(req, res)) return;
      return deleteWard(req, res);
    }
    default: {
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return jsonError(res, 405, `Method ${method} not allowed`);
    }
  }
}
