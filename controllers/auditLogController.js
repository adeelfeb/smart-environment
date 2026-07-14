import connectDB from '../lib/db';
import AuditLog from '../models/AuditLog';
import { jsonError, jsonSuccess } from '../lib/response';

export async function createAuditLog({ userId, action, targetType, targetId, details, ipAddress }) {
  try {
    await connectDB();
    await AuditLog.create({
      user: userId,
      action,
      targetType,
      targetId: targetId || null,
      details: details || null,
      ipAddress: ipAddress || null,
    });
  } catch (err) {
    console.error('[AuditLog] Failed to create audit log:', err.message);
  }
}

export async function getAuditLogs(req, res) {
  try {
    const dbResult = await connectDB();
    if (!dbResult.success) {
      return jsonError(res, 503, 'Database service is currently unavailable');
    }
    const { page = 1, limit = 50, action, targetType, userId } = req.query || {};
    const filter = {};
    if (action) filter.action = action;
    if (targetType) filter.targetType = targetType;
    if (userId) filter.user = userId;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('user', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    return jsonSuccess(res, 200, 'Ok', {
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    return jsonError(res, 500, 'Failed to fetch audit logs', err.message);
  }
}
