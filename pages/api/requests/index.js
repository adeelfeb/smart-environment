import HelpRequest from '../../../models/HelpRequest';
import ContactSubmission from '../../../models/ContactSubmission';
import authMiddleware from '../../../middlewares/authMiddleware';
import roleMiddleware from '../../../middlewares/roleMiddleware';
import { applyCors } from '../../../utils';
import { jsonSuccess, jsonError } from '../../../lib/response';
import { getDBConnection } from '../../../lib/dbHelper';

const ALLOWED_ROLES = ['superadmin', 'developer'];

const EMPTY_REQUESTS = { helpRequests: [], contactSubmissions: [] };

export default async function handler(req, res) {
  if (await applyCors(req, res)) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return jsonError(res, 405, `Method ${req.method} not allowed`);
  }

  const { connected } = await getDBConnection();
  if (!connected) {
    return jsonSuccess(res, 200, 'Requests retrieved.', EMPTY_REQUESTS);
  }

  const user = await authMiddleware(req, res);
  if (!user) return;
  if (!roleMiddleware(ALLOWED_ROLES)(req, res)) return;

  try {
    const [helpRequests, contactSubmissions] = await Promise.all([
      HelpRequest.find()
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .lean(),
      ContactSubmission.find()
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const helpList = helpRequests.map((r) => ({
      id: r._id.toString(),
      type: 'help',
      message: r.message,
      userName: r.user?.name ?? '—',
      userEmail: r.user?.email ?? '—',
      userId: r.user?._id?.toString() ?? null,
      createdAt: r.createdAt,
    }));

    const contactList = contactSubmissions.map((c) => ({
      id: c._id.toString(),
      type: 'contact',
      name: c.name,
      email: c.email,
      createdAt: c.createdAt,
    }));

    return jsonSuccess(res, 200, 'Requests retrieved.', {
      helpRequests: helpList,
      contactSubmissions: contactList,
    });
  } catch (err) {
    console.error('Requests list error:', err);
    return jsonError(res, 500, 'Failed to load requests.', err.message);
  }
}
