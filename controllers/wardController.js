import connectDB from '../lib/db';
import Ward from '../models/Ward';
import Corporation from '../models/Corporation';
import { jsonError, jsonSuccess } from '../lib/response';

export async function getWards(req, res) {
  try {
    const dbResult = await connectDB();
    if (!dbResult.success) {
      return jsonError(res, 503, 'Database service is currently unavailable');
    }
    const { corporation, includeInactive } = req.query || {};
    const filter = includeInactive === 'true' ? {} : { isActive: true };
    if (corporation) {
      filter.corporation = corporation;
    }
    const wards = await Ward.find(filter)
      .populate('corporation', 'name')
      .sort({ name: 1 })
      .lean();
    return jsonSuccess(res, 200, 'Ok', { wards });
  } catch (err) {
    return jsonError(res, 500, 'Failed to fetch wards', err.message);
  }
}

export async function getWardById(req, res) {
  try {
    const dbResult = await connectDB();
    if (!dbResult.success) {
      return jsonError(res, 503, 'Database service is currently unavailable');
    }
    const { id } = req.query;
    const ward = await Ward.findById(id).populate('corporation', 'name').lean();
    if (!ward) {
      return jsonError(res, 404, 'Ward not found');
    }
    return jsonSuccess(res, 200, 'Ok', { ward });
  } catch (err) {
    return jsonError(res, 500, 'Failed to fetch ward', err.message);
  }
}

export async function createWard(req, res) {
  try {
    const dbResult = await connectDB();
    if (!dbResult.success) {
      return jsonError(res, 503, 'Database service is currently unavailable');
    }
    const { name, corporation, wardNumber } = req.body || {};
    if (!name || !corporation) {
      return jsonError(res, 400, 'Name and corporation are required');
    }
    const trimmedName = name.trim();
    if (trimmedName.length < 1) {
      return jsonError(res, 400, 'Ward name is required');
    }
    const corp = await Corporation.findById(corporation);
    if (!corp) {
      return jsonError(res, 404, 'Corporation not found');
    }
    if (!corp.isActive) {
      return jsonError(res, 400, 'Cannot add ward to an inactive corporation');
    }
    const existing = await Ward.findOne({ name: trimmedName, corporation });
    if (existing) {
      return jsonError(res, 409, 'A ward with this name already exists in this corporation');
    }
    const ward = await Ward.create({
      name: trimmedName,
      corporation,
      wardNumber: wardNumber ? String(wardNumber).trim() : null,
      createdBy: req.user?._id || null,
    });
    return jsonSuccess(res, 201, 'Ward created', { ward });
  } catch (err) {
    if (err.code === 11000) {
      return jsonError(res, 409, 'A ward with this name already exists in this corporation');
    }
    return jsonError(res, 500, 'Failed to create ward', err.message);
  }
}

export async function updateWard(req, res) {
  try {
    const dbResult = await connectDB();
    if (!dbResult.success) {
      return jsonError(res, 503, 'Database service is currently unavailable');
    }
    const { id } = req.query;
    const { name, wardNumber, isActive } = req.body || {};
    const ward = await Ward.findById(id);
    if (!ward) {
      return jsonError(res, 404, 'Ward not found');
    }
    if (typeof name === 'string' && name.trim()) {
      ward.name = name.trim();
    }
    if (typeof wardNumber === 'string' || typeof wardNumber === 'number') {
      ward.wardNumber = String(wardNumber).trim() || null;
    }
    if (typeof isActive === 'boolean') {
      ward.isActive = isActive;
    }
    await ward.save();
    return jsonSuccess(res, 200, 'Ward updated', { ward });
  } catch (err) {
    if (err.code === 11000) {
      return jsonError(res, 409, 'A ward with this name already exists in this corporation');
    }
    return jsonError(res, 500, 'Failed to update ward', err.message);
  }
}

export async function deleteWard(req, res) {
  try {
    const dbResult = await connectDB();
    if (!dbResult.success) {
      return jsonError(res, 503, 'Database service is currently unavailable');
    }
    const { id } = req.query;
    const ward = await Ward.findById(id);
    if (!ward) {
      return jsonError(res, 404, 'Ward not found');
    }
    ward.isActive = false;
    await ward.save();
    return jsonSuccess(res, 200, 'Ward deactivated');
  } catch (err) {
    return jsonError(res, 500, 'Failed to delete ward', err.message);
  }
}
