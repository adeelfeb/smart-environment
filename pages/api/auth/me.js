import { getUserFromRequest, extractTokenFromRequest } from '../../../lib/auth';
import { jsonError, jsonSuccess } from '../../../lib/response';
import { applyCors } from '../../../utils';

function sanitizeUser(userDoc) {
  if (!userDoc) return null;
  return {
    id: userDoc._id,
    name: userDoc.name,
    email: userDoc.email,
    role: userDoc.role || 'citizen',
    roleRef: userDoc.roleRef,
    createdAt: userDoc.createdAt,
  };
}

export default async function handler(req, res) {
  if (await applyCors(req, res)) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return jsonError(res, 405, `Method ${req.method} not allowed`);
  }

  const user = await getUserFromRequest(req);
  
  if (!user) {
    return jsonSuccess(res, 200, 'Ok', { user: null });
  }

  // Extract token from request (from cookies or Authorization header)
  const token = extractTokenFromRequest(req);
  
  // Return user and token so frontend can store token in localStorage
  return jsonSuccess(res, 200, 'Ok', {
    user: sanitizeUser(user),
    token: token || null, // Include token if available
  });
}

