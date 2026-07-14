import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, required: true, trim: true, index: true },
    targetType: { type: String, required: true, trim: true, index: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, default: null },
    details: { type: mongoose.Schema.Types.Mixed, default: null },
    ipAddress: { type: String, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ action: 1, targetType: 1 });

const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
export default AuditLog;
