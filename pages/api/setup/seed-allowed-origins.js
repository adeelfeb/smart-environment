import { requireDB } from '../../../lib/dbHelper';
import AllowedOrigin from '../../../models/AllowedOrigin';
import { jsonError, jsonSuccess } from '../../../lib/response';
import { applyCors } from '../../../utils';

// Default origins to seed
const DEFAULT_ORIGINS = [];

export default async function handler(req, res) {
  // Allow CORS but don't block on origin check for setup endpoints
  if (await applyCors(req, res, { allowSameOrigin: true, allowWhenNoOrigin: true })) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST', 'OPTIONS']);
    return jsonError(res, 405, `Method ${req.method} not allowed`);
  }

  try {
    const db = await requireDB(res);
    if (!db) return;

    const results = {
      created: [],
      skipped: [],
      errors: [],
    };

    for (const originData of DEFAULT_ORIGINS) {
      try {
        const normalizedOrigin = AllowedOrigin.normalizeOrigin(originData.origin);
        if (!normalizedOrigin) {
          results.errors.push({
            origin: originData.origin,
            error: 'Invalid origin format',
          });
          continue;
        }

        // Check if origin already exists
        const existing = await AllowedOrigin.findOne({ normalizedOrigin });
        if (existing) {
          // Update if exists but inactive
          if (!existing.isActive) {
            existing.isActive = true;
            existing.label = originData.label;
            existing.description = originData.description;
            await existing.save();
            results.created.push({
              origin: normalizedOrigin,
              action: 'updated',
            });
          } else {
            results.skipped.push({
              origin: normalizedOrigin,
              reason: 'Already exists and active',
            });
          }
        } else {
          // Create new origin
          const created = await AllowedOrigin.create({
            origin: normalizedOrigin,
            normalizedOrigin,
            label: originData.label,
            description: originData.description,
            isActive: originData.isActive,
          });
          results.created.push({
            origin: normalizedOrigin,
            action: 'created',
            id: created._id.toString(),
          });
        }
      } catch (error) {
        results.errors.push({
          origin: originData.origin,
          error: error.message || 'Unknown error',
        });
      }
    }

    return jsonSuccess(res, 200, 'Default origins seeded', results);
  } catch (error) {
    return jsonError(res, 500, 'Failed to seed allowed origins', error.message);
  }
}

