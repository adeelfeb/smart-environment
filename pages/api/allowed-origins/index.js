import { getDBConnection, requireDB } from '../../../lib/dbHelper';
import { jsonError, jsonSuccess } from '../../../lib/response';
import authMiddleware from '../../../middlewares/authMiddleware';
import roleMiddleware from '../../../middlewares/roleMiddleware';
import AllowedOrigin from '../../../models/AllowedOrigin';
import { applyCors, clearCorsCache } from '../../../utils';

function normalizeBoolean(value, fallback) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return fallback;
}

function serializeOrigin(doc) {
  if (!doc) return null;
  return {
    id: doc._id.toString(),
    origin: doc.origin,
    label: doc.label || '',
    description: doc.description || '',
    isActive: Boolean(doc.isActive),
    createdAt: doc.createdAt?.toISOString?.() || doc.createdAt,
    updatedAt: doc.updatedAt?.toISOString?.() || doc.updatedAt,
    createdBy: doc.createdBy ? doc.createdBy.toString() : null,
    updatedBy: doc.updatedBy ? doc.updatedBy.toString() : null,
  };
}

export default async function handler(req, res) {
  if (await applyCors(req, res)) return;

  const method = req.method?.toUpperCase() || 'GET';

  if (method === 'OPTIONS') {
    return;
  }

  const { connected } = await getDBConnection();
  if (!connected && method === 'GET') {
    return jsonSuccess(res, 200, 'Allowed origins loaded', { origins: [] });
  }
  if (!connected) {
    return jsonError(res, 503, 'Database service is currently unavailable. Please try again later.');
  }

  const user = await authMiddleware(req, res);
  if (!user) return;

  if (!roleMiddleware(['superadmin', 'developer'])(req, res)) {
    return;
  }

  const db = await requireDB(res);
  if (!db) return;

  switch (method) {
    case 'GET': {
      try {
        const activeOnly = normalizeBoolean(req.query?.activeOnly, false);
        const filter = activeOnly ? { isActive: true } : {};
        const origins = await AllowedOrigin.find(filter)
          .sort({ createdAt: -1 })
          .lean();
        return jsonSuccess(res, 200, 'Allowed origins loaded', {
          origins: origins.map(serializeOrigin),
        });
      } catch (error) {
        return jsonError(res, 500, 'Failed to load allowed origins', error.message);
      }
    }
    case 'POST': {
      try {
        const { origin, label = '', description = '', isActive = true } = req.body || {};

        if (typeof origin !== 'string' || !origin.trim()) {
          return jsonError(res, 400, 'Origin is required');
        }

        const normalizedOrigin = AllowedOrigin.normalizeOrigin(origin);
        if (!normalizedOrigin) {
          return jsonError(res, 400, 'Origin must be a valid HTTP or HTTPS URL');
        }

        const exists = await AllowedOrigin.findOne({ normalizedOrigin });
        if (exists) {
          return jsonError(res, 409, 'Origin already exists');
        }

        const created = await AllowedOrigin.create({
          origin: normalizedOrigin,
          label: typeof label === 'string' ? label.trim() : '',
          description: typeof description === 'string' ? description.trim() : '',
          isActive: normalizeBoolean(isActive, true),
          createdBy: user._id,
          updatedBy: user._id,
        });

        clearCorsCache();

        return jsonSuccess(res, 201, 'Allowed origin created', {
          origin: serializeOrigin(created),
        });
      } catch (error) {
        if (error.code === 11000) {
          return jsonError(res, 409, 'Origin already exists');
        }
        return jsonError(res, 500, 'Failed to create allowed origin', error.message);
      }
    }
    default: {
      res.setHeader('Allow', ['GET', 'POST', 'OPTIONS']);
      return jsonError(res, 405, `Method ${method} not allowed`);
    }
  }
}


