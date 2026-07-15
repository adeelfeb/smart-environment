import connectDB from '../lib/db';
import Notification from '../models/Notification';
import User from '../models/User';
import { jsonError, jsonSuccess } from '../lib/response';

export async function createNotification({ recipient, type, title, message, targetRef, targetType, actor }) {
  try {
    await connectDB();
    await Notification.create({ recipient, type, title, message, targetRef, targetType, actor });
  } catch (err) {
    console.error('[Notification] Failed to create:', err.message);
  }
}

export async function notifyAdmins({ type, title, message, targetRef, targetType, actor }) {
  try {
    const dbResult = await connectDB();
    if (!dbResult.success) return;
    const admins = await User.find({ role: { $in: ['superadmin', 'admin', 'developer'] } }).select('_id').lean();
    const docs = admins
      .filter((a) => a._id.toString() !== actor?.toString())
      .map((a) => ({ recipient: a._id, type, title, message, targetRef, targetType, actor }));
    if (docs.length > 0) {
      await Notification.insertMany(docs, { ordered: false });
    }
  } catch (err) {
    console.error('[Notification] Failed to notify admins:', err.message);
  }
}

export async function getNotifications(req, res) {
  try {
    const dbResult = await connectDB();
    if (!dbResult.success) {
      return jsonError(res, 503, 'Database service is currently unavailable');
    }
    const { limit = 20, unreadOnly } = req.query || {};
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const filter = { recipient: req.user._id };
    if (unreadOnly === 'true') filter.read = false;

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(filter)
        .populate('actor', 'name')
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .lean(),
      Notification.countDocuments({ recipient: req.user._id, read: false }),
    ]);

    return jsonSuccess(res, 200, 'Ok', { notifications, unreadCount });
  } catch (err) {
    return jsonError(res, 500, 'Failed to fetch notifications', err.message);
  }
}

export async function markAsRead(req, res) {
  try {
    const dbResult = await connectDB();
    if (!dbResult.success) {
      return jsonError(res, 503, 'Database service is currently unavailable');
    }
    const { id } = req.query;
    if (id === 'all') {
      await Notification.updateMany({ recipient: req.user._id, read: false }, { $set: { read: true } });
      return jsonSuccess(res, 200, 'All notifications marked as read');
    }
    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: req.user._id },
      { $set: { read: true } },
      { new: true }
    );
    if (!notification) {
      return jsonError(res, 404, 'Notification not found');
    }
    return jsonSuccess(res, 200, 'Notification marked as read', { notification });
  } catch (err) {
    return jsonError(res, 500, 'Failed to mark notification as read', err.message);
  }
}

export async function getUnreadCount(req, res) {
  try {
    const dbResult = await connectDB();
    if (!dbResult.success) {
      return jsonError(res, 503, 'Database service is currently unavailable');
    }
    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, read: false });
    return jsonSuccess(res, 200, 'Ok', { unreadCount });
  } catch (err) {
    return jsonError(res, 500, 'Failed to fetch unread count', err.message);
  }
}
