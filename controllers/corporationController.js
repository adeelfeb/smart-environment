import connectDB from '../lib/db';
import Corporation from '../models/Corporation';
import Ward from '../models/Ward';
import { jsonError, jsonSuccess } from '../lib/response';

export async function getCorporations(req, res) {
  try {
    const dbResult = await connectDB();
    if (!dbResult.success) {
      return jsonError(res, 503, 'Database service is currently unavailable');
    }
    const { includeInactive } = req.query || {};
    const filter = includeInactive === 'true' ? {} : { isActive: true };
    const corporations = await Corporation.find(filter).sort({ name: 1 }).lean();
    return jsonSuccess(res, 200, 'Ok', { corporations });
  } catch (err) {
    return jsonError(res, 500, 'Failed to fetch corporations', err.message);
  }
}

export async function getCorporationById(req, res) {
  try {
    const dbResult = await connectDB();
    if (!dbResult.success) {
      return jsonError(res, 503, 'Database service is currently unavailable');
    }
    const { id } = req.query;
    const corporation = await Corporation.findById(id).lean();
    if (!corporation) {
      return jsonError(res, 404, 'Corporation not found');
    }
    return jsonSuccess(res, 200, 'Ok', { corporation });
  } catch (err) {
    return jsonError(res, 500, 'Failed to fetch corporation', err.message);
  }
}

export async function createCorporation(req, res) {
  try {
    const dbResult = await connectDB();
    if (!dbResult.success) {
      return jsonError(res, 503, 'Database service is currently unavailable');
    }
    const { name, state, district } = req.body || {};
    if (!name || !state || !district) {
      return jsonError(res, 400, 'Name, state, and district are required');
    }
    const trimmedName = name.trim();
    const trimmedState = state.trim();
    const trimmedDistrict = district.trim();
    if (trimmedName.length < 2) {
      return jsonError(res, 400, 'Corporation name must be at least 2 characters');
    }
    const existing = await Corporation.findOne({ name: trimmedName });
    if (existing) {
      return jsonError(res, 409, 'A corporation with this name already exists');
    }
    const corporation = await Corporation.create({
      name: trimmedName,
      state: trimmedState,
      district: trimmedDistrict,
      createdBy: req.user?._id || null,
    });
    return jsonSuccess(res, 201, 'Corporation created', { corporation });
  } catch (err) {
    if (err.code === 11000) {
      return jsonError(res, 409, 'A corporation with this name already exists');
    }
    return jsonError(res, 500, 'Failed to create corporation', err.message);
  }
}

export async function updateCorporation(req, res) {
  try {
    const dbResult = await connectDB();
    if (!dbResult.success) {
      return jsonError(res, 503, 'Database service is currently unavailable');
    }
    const { id } = req.query;
    const { name, state, district, isActive } = req.body || {};
    const corporation = await Corporation.findById(id);
    if (!corporation) {
      return jsonError(res, 404, 'Corporation not found');
    }
    if (typeof name === 'string' && name.trim()) {
      corporation.name = name.trim();
    }
    if (typeof state === 'string' && state.trim()) {
      corporation.state = state.trim();
    }
    if (typeof district === 'string' && district.trim()) {
      corporation.district = district.trim();
    }
    if (typeof isActive === 'boolean') {
      corporation.isActive = isActive;
    }
    await corporation.save();
    return jsonSuccess(res, 200, 'Corporation updated', { corporation });
  } catch (err) {
    if (err.code === 11000) {
      return jsonError(res, 409, 'A corporation with this name already exists');
    }
    return jsonError(res, 500, 'Failed to update corporation', err.message);
  }
}

export async function deleteCorporation(req, res) {
  try {
    const dbResult = await connectDB();
    if (!dbResult.success) {
      return jsonError(res, 503, 'Database service is currently unavailable');
    }
    const { id } = req.query;
    const corporation = await Corporation.findById(id);
    if (!corporation) {
      return jsonError(res, 404, 'Corporation not found');
    }
    corporation.isActive = false;
    await corporation.save();
    return jsonSuccess(res, 200, 'Corporation deactivated');
  } catch (err) {
    return jsonError(res, 500, 'Failed to delete corporation', err.message);
  }
}
