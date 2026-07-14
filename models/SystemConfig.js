import mongoose from 'mongoose';

const SystemConfigSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: mongoose.Schema.Types.Mixed, default: null },
    description: { type: String, default: null, trim: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const SystemConfig = mongoose.models.SystemConfig || mongoose.model('SystemConfig', SystemConfigSchema);
export default SystemConfig;
