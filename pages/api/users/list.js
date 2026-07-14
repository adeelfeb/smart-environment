import { getDBConnection, requireDB } from '../../../lib/dbHelper';
import User from '../../../models/User';
import authMiddleware from '../../../middlewares/authMiddleware';
import roleMiddleware from '../../../middlewares/roleMiddleware';
import { jsonError, jsonSuccess } from '../../../lib/response';
import { applyCors } from '../../../utils';

export default async function handler(req, res) {
  if (await applyCors(req, res)) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return jsonError(res, 405, `Method ${req.method} not allowed`);
  }

  const { connected } = await getDBConnection();
  if (!connected) {
    return jsonSuccess(res, 200, 'Users fetched', []);
  }

  const sessionUser = await authMiddleware(req, res);
  if (!sessionUser) return;
  if (!roleMiddleware(['superadmin', 'developer'])(req, res)) return;

  try {
    const db = await requireDB(res);
    if (!db) return;
    const users = await User.find()
      .select('name email username role createdAt updatedAt isEmailVerified isPaused')
      .sort({ createdAt: -1 });

    const normalizedUsers = users.map((userDoc) => ({
      id: userDoc._id.toString(),
      _id: userDoc._id.toString(),
      name: userDoc.name,
      email: userDoc.email,
      username: userDoc.username,
      role: userDoc.role,
      isEmailVerified: Boolean(userDoc.isEmailVerified),
      isPaused: Boolean(userDoc.isPaused),
      createdAt: userDoc.createdAt,
      updatedAt: userDoc.updatedAt,
    }));

    return jsonSuccess(res, 200, 'Users fetched', normalizedUsers);
  } catch (error) {
    return jsonError(res, 500, 'Failed to fetch users', error.message);
  }
}


