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
