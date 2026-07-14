import mongoose from 'mongoose';

const WardSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    corporation: { type: mongoose.Schema.Types.ObjectId, ref: 'Corporation', required: true, index: true },
    wardNumber: { type: String, default: null, trim: true },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

WardSchema.index({ name: 'text' });
WardSchema.index({ corporation: 1, name: 1 }, { unique: true });

const Ward = mongoose.models.Ward || mongoose.model('Ward', WardSchema);
export default Ward;
