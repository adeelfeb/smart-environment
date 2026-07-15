import { getComplaintById, updateComplaintStatus, addRemark, uploadVerificationPhoto, deleteComplaint } from '../../../controllers/complaintController';
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
      return getComplaintById(req, res);
    }
    case 'PUT': {
      const user = await authMiddleware(req, res);
      if (!user) return;
      if (!roleMiddleware(['admin', 'superadmin', 'developer'])(req, res)) return;
      const { action } = req.body || {};
      if (action === 'add-remark') {
        return addRemark(req, res);
      }
      if (action === 'upload-verification') {
        return uploadVerificationPhoto(req, res);
      }
      return updateComplaintStatus(req, res);
    }
    case 'DELETE': {
      const user = await authMiddleware(req, res);
      if (!user) return;
      return deleteComplaint(req, res);
    }
    default: {
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return jsonError(res, 405, `Method ${method} not allowed`);
    }
  }
}
