import { requireDB } from '../../../lib/dbHelper';
import { jsonError, jsonSuccess } from '../../../lib/response';
import authMiddleware from '../../../middlewares/authMiddleware';
import roleMiddleware from '../../../middlewares/roleMiddleware';
import AllowedOrigin from '../../../models/AllowedOrigin';
import { applyCors, clearCorsCache } from '../../../utils';

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

  const user = await authMiddleware(req, res);
  if (!user) return;

  if (!roleMiddleware(['superadmin', 'developer'])(req, res)) {
    return;
  }

  const db = await requireDB(res);
  if (!db) return;

  const { id } = req.query || {};
  if (!id) {
    return jsonError(res, 400, 'Origin id is required');
  }

  switch (method) {
    case 'GET': {
      try {
        const origin = await AllowedOrigin.findById(id).lean();
        if (!origin) {
          return jsonError(res, 404, 'Allowed origin not found');
        }
        return jsonSuccess(res, 200, 'Allowed origin loaded', {
          origin: serializeOrigin(origin),
        });
      } catch (error) {
        return jsonError(res, 500, 'Failed to load allowed origin', error.message);
      }
    }
    case 'PUT':
    case 'PATCH': {
      try {
        const { origin, label, description, isActive } = req.body || {};

        const update = {};
        if (typeof origin === 'string') {
          const normalized = AllowedOrigin.normalizeOrigin(origin);
          if (!normalized) {
            return jsonError(res, 400, 'Origin must be a valid HTTP or HTTPS URL');
          }
          update.origin = normalized;
          update.normalizedOrigin = normalized;
        }
        if (typeof label === 'string') {
          update.label = label.trim();
        }
        if (typeof description === 'string') {
          update.description = description.trim();
        }
        if (typeof isActive !== 'undefined') {
          if (typeof isActive === 'boolean') {
            update.isActive = isActive;
          } else if (typeof isActive === 'string') {
            const normalized = isActive.trim().toLowerCase();
            if (normalized === 'true') {
              update.isActive = true;
            } else if (normalized === 'false') {
              update.isActive = false;
            } else {
              return jsonError(res, 400, 'isActive must be a boolean value');
            }
          } else {
            return jsonError(res, 400, 'isActive must be a boolean value');
          }
        }

        if (!Object.keys(update).length) {
          return jsonError(res, 400, 'No valid fields supplied for update');
        }

        update.updatedBy = user._id;

        const updated = await AllowedOrigin.findByIdAndUpdate(
          id,
          { $set: update },
          { new: true, runValidators: true }
        );

        if (!updated) {
          return jsonError(res, 404, 'Allowed origin not found');
        }

        clearCorsCache();

        return jsonSuccess(res, 200, 'Allowed origin updated', {
          origin: serializeOrigin(updated),
        });
      } catch (error) {
        if (error.code === 11000) {
          return jsonError(res, 409, 'Origin already exists');
        }
        return jsonError(res, 500, 'Failed to update allowed origin', error.message);
      }
    }
    case 'DELETE': {
      try {
        const deleted = await AllowedOrigin.findByIdAndDelete(id);
        if (!deleted) {
          return jsonError(res, 404, 'Allowed origin not found');
        }

        clearCorsCache();

        return jsonSuccess(res, 200, 'Allowed origin deleted', {
          origin: serializeOrigin(deleted),
        });
      } catch (error) {
        return jsonError(res, 500, 'Failed to delete allowed origin', error.message);
      }
    }
    default: {
      res.setHeader('Allow', ['GET', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']);
      return jsonError(res, 405, `Method ${method} not allowed`);
    }
  }
}


