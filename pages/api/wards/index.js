import { getWards, createWard } from '../../../controllers/wardController';
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
      return getWards(req, res);
    }
    case 'POST': {
      const user = await authMiddleware(req, res);
      if (!user) return;
      if (!roleMiddleware(['superadmin', 'developer', 'admin'])(req, res)) return;
      return createWard(req, res);
    }
    default: {
      res.setHeader('Allow', ['GET', 'POST']);
      return jsonError(res, 405, `Method ${method} not allowed`);
    }
  }
}
