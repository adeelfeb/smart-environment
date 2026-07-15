import connectDB from '../lib/db';
import Complaint, { COMPLAINT_CATEGORIES, COMPLAINT_STATUSES } from '../models/Complaint';
import Corporation from '../models/Corporation';
import Ward from '../models/Ward';
import { jsonError, jsonSuccess } from '../lib/response';
import { createAuditLog } from './auditLogController';

let complaintCounter = 0;

async function generateComplaintId() {
  await connectDB();
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const count = await Complaint.countDocuments();
  complaintCounter = count + 1;
  const seq = String(complaintCounter).padStart(5, '0');
  return `WM-${dateStr}-${seq}`;
}

export async function submitComplaint(req, res) {
  try {
    const dbResult = await connectDB();
    if (!dbResult.success) {
      return jsonError(res, 503, 'Database service is currently unavailable');
    }
    const { category, description, corporationId, wardId, latitude, longitude, address, dateCaptured, photoUrl, photoFilename, photos } = req.body || {};

    if (!category) return jsonError(res, 400, 'Complaint category is required');
    if (!COMPLAINT_CATEGORIES.includes(category)) {
      return jsonError(res, 400, `Invalid category. Must be one of: ${COMPLAINT_CATEGORIES.join(', ')}`);
    }
    if (!description || !description.trim()) return jsonError(res, 400, 'Description is required');
    if (description.trim().length > 500) return jsonError(res, 400, 'Description must be 500 characters or less');
    if (!corporationId) return jsonError(res, 400, 'Corporation is required');
    if (!wardId) return jsonError(res, 400, 'Ward is required');

    const corporation = await Corporation.findById(corporationId);
    if (!corporation || !corporation.isActive) {
      return jsonError(res, 400, 'Selected corporation is not available');
    }
    const ward = await Ward.findById(wardId);
    if (!ward || !ward.isActive) {
      return jsonError(res, 400, 'Selected ward is not available');
    }
    if (ward.corporation.toString() !== corporationId) {
      return jsonError(res, 400, 'Selected ward does not belong to the selected corporation');
    }

    const complaintId = await generateComplaintId();

    const complaint = await Complaint.create({
      complaintId,
      citizen: req.user._id,
      category,
      description: description.trim(),
      photoUrl: photoUrl || null,
      photoFilename: photoFilename || null,
      photos: Array.isArray(photos) ? photos.filter((p) => p?.url) : [],
      location: {
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        address: address ? String(address).trim() : null,
        dateCaptured: (dateCaptured && !isNaN(new Date(dateCaptured).getTime())) ? new Date(dateCaptured) : new Date(),
      },
      corporation: corporationId,
      ward: wardId,
      status: 'Pending',
      priority: 'Medium',
    });

    await createAuditLog({
      userId: req.user._id,
      action: 'COMPLAINT_SUBMITTED',
      targetType: 'Complaint',
      targetId: complaint._id,
      details: { complaintId, category, corporationId, wardId },
      ipAddress: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null,
    });

    return jsonSuccess(res, 201, 'Complaint submitted successfully', { complaint });
  } catch (err) {
    return jsonError(res, 500, 'Failed to submit complaint', err.message);
  }
}

export async function getComplaints(req, res) {
  try {
    const dbResult = await connectDB();
    if (!dbResult.success) {
      return jsonError(res, 503, 'Database service is currently unavailable');
    }
    const { page = 1, limit = 20, status, category, corporation, ward, search, dateFrom, dateTo, priority } = req.query || {};
    const user = req.user;
    const filter = {};

    if (user.role === 'citizen' || user.role === 'base_user') {
      filter.citizen = user._id;
    }

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (corporation) filter.corporation = corporation;
    if (ward) filter.ward = ward;
    if (priority) filter.priority = priority;

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo + 'T23:59:59.999Z');
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { complaintId: searchRegex },
        { description: searchRegex },
        { 'location.address': searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [complaints, total] = await Promise.all([
      Complaint.find(filter)
        .populate('citizen', 'name email')
        .populate('corporation', 'name')
        .populate('ward', 'name wardNumber')
        .populate('resolvedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Complaint.countDocuments(filter),
    ]);

    return jsonSuccess(res, 200, 'Ok', {
      complaints,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    return jsonError(res, 500, 'Failed to fetch complaints', err.message);
  }
}

export async function getComplaintById(req, res) {
  try {
    const dbResult = await connectDB();
    if (!dbResult.success) {
      return jsonError(res, 503, 'Database service is currently unavailable');
    }
    const { id } = req.query;
    const complaint = await Complaint.findById(id)
      .populate('citizen', 'name email phone')
      .populate('corporation', 'name state district')
      .populate('ward', 'name wardNumber')
      .populate('resolvedBy', 'name')
      .populate('adminRemarks.addedBy', 'name role')
      .lean();
    if (!complaint) {
      return jsonError(res, 404, 'Complaint not found');
    }
    const user = req.user;
    if ((user.role === 'citizen' || user.role === 'base_user') && complaint.citizen._id.toString() !== user._id.toString()) {
      return jsonError(res, 403, 'Access denied');
    }
    return jsonSuccess(res, 200, 'Ok', { complaint });
  } catch (err) {
    return jsonError(res, 500, 'Failed to fetch complaint', err.message);
  }
}

export async function updateComplaintStatus(req, res) {
  try {
    const dbResult = await connectDB();
    if (!dbResult.success) {
      return jsonError(res, 503, 'Database service is currently unavailable');
    }
    const { id } = req.query;
    const { status, priority } = req.body || {};
    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return jsonError(res, 404, 'Complaint not found');
    }
    if (status && !COMPLAINT_STATUSES.includes(status)) {
      return jsonError(res, 400, `Invalid status. Must be one of: ${COMPLAINT_STATUSES.join(', ')}`);
    }
    const oldStatus = complaint.status;
    if (status) complaint.status = status;
    if (priority) complaint.priority = priority;

    if (status === 'Resolved') {
      complaint.resolvedAt = new Date();
      complaint.resolvedBy = req.user._id;
    }
    if (status === 'Rejected') {
      complaint.rejectedAt = new Date();
    }

    complaint.adminRemarks.push({
      remark: `Status changed from ${oldStatus} to ${status || complaint.status}`,
      status: status || complaint.status,
      addedBy: req.user._id,
      addedAt: new Date(),
    });

    await complaint.save();

    await createAuditLog({
      userId: req.user._id,
      action: 'COMPLAINT_STATUS_UPDATED',
      targetType: 'Complaint',
      targetId: complaint._id,
      details: { complaintId: complaint.complaintId, oldStatus, newStatus: complaint.status },
      ipAddress: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null,
    });

    return jsonSuccess(res, 200, 'Complaint updated', { complaint });
  } catch (err) {
    return jsonError(res, 500, 'Failed to update complaint', err.message);
  }
}

export async function addRemark(req, res) {
  try {
    const dbResult = await connectDB();
    if (!dbResult.success) {
      return jsonError(res, 503, 'Database service is currently unavailable');
    }
    const { id } = req.query;
    const { remark } = req.body || {};
    if (!remark || !remark.trim()) {
      return jsonError(res, 400, 'Remark is required');
    }
    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return jsonError(res, 404, 'Complaint not found');
    }
    complaint.adminRemarks.push({
      remark: remark.trim(),
      status: complaint.status,
      addedBy: req.user._id,
      addedAt: new Date(),
    });
    await complaint.save();

    await createAuditLog({
      userId: req.user._id,
      action: 'COMPLAINT_REMARK_ADDED',
      targetType: 'Complaint',
      targetId: complaint._id,
      details: { complaintId: complaint.complaintId },
      ipAddress: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null,
    });

    return jsonSuccess(res, 200, 'Remark added', { complaint });
  } catch (err) {
    return jsonError(res, 500, 'Failed to add remark', err.message);
  }
}

export async function uploadVerificationPhoto(req, res) {
  try {
    const dbResult = await connectDB();
    if (!dbResult.success) {
      return jsonError(res, 503, 'Database service is currently unavailable');
    }
    const { id } = req.query;
    const { photoUrl, photoFilename } = req.body || {};
    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return jsonError(res, 404, 'Complaint not found');
    }
    complaint.verificationPhoto = photoUrl || null;
    complaint.verificationPhotoFilename = photoFilename || null;
    await complaint.save();

    await createAuditLog({
      userId: req.user._id,
      action: 'VERIFICATION_PHOTO_UPLOADED',
      targetType: 'Complaint',
      targetId: complaint._id,
      details: { complaintId: complaint.complaintId },
      ipAddress: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null,
    });

    return jsonSuccess(res, 200, 'Verification photo uploaded', { complaint });
  } catch (err) {
    return jsonError(res, 500, 'Failed to upload verification photo', err.message);
  }
}

export async function getDashboardStats(req, res) {
  try {
    const dbResult = await connectDB();
    if (!dbResult.success) {
      return jsonError(res, 503, 'Database service is currently unavailable');
    }
    const filter = {};

    const [
      total,
      pending,
      underReview,
      workInProgress,
      resolved,
      rejected,
    ] = await Promise.all([
      Complaint.countDocuments(filter),
      Complaint.countDocuments({ ...filter, status: 'Pending' }),
      Complaint.countDocuments({ ...filter, status: 'Under Review' }),
      Complaint.countDocuments({ ...filter, status: 'Work in Progress' }),
      Complaint.countDocuments({ ...filter, status: 'Resolved' }),
      Complaint.countDocuments({ ...filter, status: 'Rejected' }),
    ]);

    let avgResolutionTime = 0;
    const resolvedComplaints = await Complaint.find({
      ...filter,
      status: 'Resolved',
      resolvedAt: { $exists: true, $ne: null },
    })
      .select('createdAt resolvedAt')
      .lean();
    if (resolvedComplaints.length > 0) {
      const totalTime = resolvedComplaints.reduce((acc, c) => {
        return acc + (new Date(c.resolvedAt) - new Date(c.createdAt));
      }, 0);
      avgResolutionTime = Math.round(totalTime / resolvedComplaints.length / (1000 * 60 * 60 * 24));
    }

    const complaintsByCategory = await Complaint.aggregate([
      { $match: filter },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const complaintsByWard = await Complaint.aggregate([
      { $match: filter },
      { $group: { _id: '$ward', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const complaintsByCorporation = await Complaint.aggregate([
      { $match: filter },
      { $group: { _id: '$corporation', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const dailyTrend = await Complaint.aggregate([
      { $match: { ...filter, createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return jsonSuccess(res, 200, 'Ok', {
      stats: {
        total,
        pending,
        underReview,
        workInProgress,
        resolved,
        rejected,
        avgResolutionTime,
      },
      complaintsByCategory,
      complaintsByWard,
      complaintsByCorporation,
      dailyTrend,
    });
  } catch (err) {
    return jsonError(res, 500, 'Failed to fetch dashboard stats', err.message);
  }
}

export async function getComplaintMapData(req, res) {
  try {
    const dbResult = await connectDB();
    if (!dbResult.success) {
      return jsonError(res, 503, 'Database service is currently unavailable');
    }
    const filter = { 'location.latitude': { $ne: null }, 'location.longitude': { $ne: null } };

    const complaints = await Complaint.find(filter)
      .select('complaintId category status priority location corporation ward createdAt')
      .populate('corporation', 'name')
      .populate('ward', 'name')
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    return jsonSuccess(res, 200, 'Ok', { complaints });
  } catch (err) {
    return jsonError(res, 500, 'Failed to fetch map data', err.message);
  }
}
