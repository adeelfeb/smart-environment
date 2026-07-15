import mongoose from 'mongoose';

const COMPLAINT_CATEGORIES = [
  'Overflowing Dustbin',
  'Unauthorized Garbage Dumping',
  'Damaged Dustbin',
  'Missing Dustbin',
];

const COMPLAINT_STATUSES = [
  'Pending',
  'Under Review',
  'Work in Progress',
  'Resolved',
  'Rejected',
];

const COMPLAINT_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

const ComplaintSchema = new mongoose.Schema(
  {
    complaintId: { type: String, required: true, unique: true, index: true },
    citizen: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: {
      type: String,
      required: true,
      enum: COMPLAINT_CATEGORIES,
      index: true,
    },
    description: { type: String, required: true, maxlength: 500, trim: true },
    photoUrl: { type: String, default: null },
    photoFilename: { type: String, default: null },
    photos: [{
      url: { type: String, required: true },
      filename: { type: String, default: '' },
    }],
    location: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      address: { type: String, default: null, trim: true },
      dateCaptured: { type: Date, default: null },
    },
    corporation: { type: mongoose.Schema.Types.ObjectId, ref: 'Corporation', required: true, index: true },
    ward: { type: mongoose.Schema.Types.ObjectId, ref: 'Ward', required: true, index: true },
    status: {
      type: String,
      default: 'Pending',
      enum: COMPLAINT_STATUSES,
      index: true,
    },
    priority: {
      type: String,
      default: 'Medium',
      enum: COMPLAINT_PRIORITIES,
    },
    adminRemarks: [
      {
        remark: { type: String, required: true, trim: true },
        status: { type: String, enum: COMPLAINT_STATUSES },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        addedAt: { type: Date, default: Date.now },
      },
    ],
    verificationPhoto: { type: String, default: null },
    verificationPhotoFilename: { type: String, default: null },
    resolvedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

ComplaintSchema.index({ createdAt: -1 });
ComplaintSchema.index({ status: 1, corporation: 1 });
ComplaintSchema.index({ status: 1, ward: 1 });
ComplaintSchema.index({ category: 1, status: 1 });

const Complaint = mongoose.models.Complaint || mongoose.model('Complaint', ComplaintSchema);

export { COMPLAINT_CATEGORIES, COMPLAINT_STATUSES, COMPLAINT_PRIORITIES };
export default Complaint;
