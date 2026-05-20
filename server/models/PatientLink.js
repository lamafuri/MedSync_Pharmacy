import mongoose from 'mongoose';

const patientLinkSchema = new mongoose.Schema({
  pharmacistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pharmacist',
    required: true,
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  qrToken: {
    type: String,
    required: true,
  },
  patientEmail: {
    type: String,
    trim: true,
  },
  patientPhone: {
    type: String,
    trim: true,
  },
  patientAddress: {
    type: String,
    trim: true,
  },
  notifyLowStock: {
    type: Boolean,
    default: true,
  },
  notifyOffers: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Unique index on pharmacistId and patientId combination
patientLinkSchema.index({ pharmacistId: 1, patientId: 1 }, { unique: true });

export default mongoose.model('PatientLink', patientLinkSchema);
