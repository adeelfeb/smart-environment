import mongoose from 'mongoose';

const NOTIFICATION_TYPES = [
  'complaint_submitted',
  'complaint_status_updated',
  'complaint_remark_added',
  'complaint_resolved',
  'complaint_rejected',
  'complaint_priority_escalated',
  'verification_uploaded',
];

const NotificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true, enum: NOTIFICATION_TYPES, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    targetRef: { type: mongoose.Schema.Types.ObjectId, default: null },
    targetType: { type: String, default: null },
    read: { type: Boolean, default: false, index: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, read: 1 });

const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

export { NOTIFICATION_TYPES };
export default Notification;
