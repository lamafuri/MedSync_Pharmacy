import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  recipientModel: {
    type: String,
    enum: ['Patient', 'Pharmacist'],
    required: true,
  },
  type: {
    type: String,
    enum: ['offer', 'low_stock', 'system'],
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  offerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offer',
  },
  pharmacyName: {
    type: String,
    default: '',
  },
  pharmacyAddress: {
    type: String,
    default: '',
  },
  pharmacyPhone: {
    type: String,
    default: '',
  },
  offerTitle: {
    type: String,
    default: '',
  },
  offerMessage: {
    type: String,
    default: '',
  },
  medicineName: {
    type: String,
    default: '',
  },
  discountPercent: {
    type: Number,
    default: 0,
  },
  offerType: {
    type: String,
    default: '',
  },
  expiresAt: {
    type: Date,
  },
  orderPlaced: {
    type: Boolean,
    default: false,
  },
  orderPlacedAt: {
    type: Date,
  },
  read: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

export default mongoose.model('Notification', notificationSchema);
