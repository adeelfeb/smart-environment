import mongoose from 'mongoose';

const CorporationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    state: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

CorporationSchema.index({ name: 'text', state: 'text', district: 'text' });

const Corporation = mongoose.models.Corporation || mongoose.model('Corporation', CorporationSchema);
export default Corporation;
