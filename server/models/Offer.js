import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema({
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
  medicineName: {
    type: String,
    required: true,
    trim: true,
  },
  offerType: {
    type: String,
    enum: ['discount', 'buy2get1', 'bundle', 'custom'],
    required: true,
  },
  discountPercent: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  fullMessage: {
    type: String,
    trim: true,
  },
  shortMessage: {
    type: String,
    trim: true,
  },
  channels: [{
    type: String,
    enum: ['email', 'sms', 'in_app'],
  }],
  status: {
    type: String,
    enum: ['draft', 'sent', 'accepted', 'expired'],
    default: 'draft',
  },
  expiresAt: {
    type: Date,
  },
  sentAt: {
    type: Date,
  },
  aiGenerated: {
    type: Boolean,
    default: false,
  },
  posterUrl: {
    type: String,
  },
}, {
  timestamps: true,
});

export default mongoose.model('Offer', offerSchema);
